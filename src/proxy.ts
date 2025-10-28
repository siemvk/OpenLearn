import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { Embed, Webhook } from "@vermaysha/discord-webhook";
import { decodeCookie } from "@/utils/auth/session";
import { prisma } from "@/utils/prisma";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip static files, API routes, and prefetch
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    /\.(css|js|ts|tsx|jsx|woff2?|ttf|png|jpg|jpeg|gif|svg|webmanifest)$/.test(pathname) ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("Next-Router-Prefetch") === "1" ||
    request.headers.get("RSC") === "1" ||
    request.nextUrl.searchParams.has("_rsc")
  ) {
    return NextResponse.next();
  }

  // Bot / scanner detection (before any heavier logic)
  const userAgent = request.headers.get("user-agent") || "";
  if (
    pathname.endsWith(".php") ||
    pathname.endsWith(".phtml") ||
    pathname.endsWith(".phps") ||
    pathname.endsWith(".cgi") ||
    pathname.endsWith(".env") ||
    pathname.includes("/wp-") ||
    ["curl", "wget", "httpie", "powershell", "go-http-client"].some((bot) =>
      userAgent.toLowerCase().includes(bot)
    )
  ) {
    const ip = request.headers.get("CF-Connecting-IP")
      ? `${request.headers.get("CF-Connecting-IP")} (CF-Connecting-IP)`
      : request.headers.get("x-forwarded-for")
        ? `${request.headers.get("x-forwarded-for")} (x-forwarded-for)`
        : "Onbekend";
    const embed = new Embed()
      .setTitle("Automatische scanrapport")
      .addField({ name: "IP", value: ip, inline: true })
      .addField({ name: "useragent", value: userAgent, inline: true })
      .addField({ name: "Geprobeerde pad", value: pathname, inline: true })
      .setColor("#0099ff")
      .setTimestamp();

    const freshWebhook = new Webhook(process.env.DISCORD_WEBHOOK || "");
    freshWebhook.setUsername("Iemand zit gaar te doen");
    freshWebhook.addEmbed(embed);
    freshWebhook
      .setContent(`@here
\`\`\`
[ Automatische scanrapport ]
Tijd: ${new Date().toLocaleString()}
IP: ${ip}
useragent: ${userAgent}
Geprobeerde pad: ${pathname}

[ Automatisch gegenereerd door PolarLearn ]
\`\`\``)
      .send();

    return new NextResponse(
      "Foei kutbot!! Tyf nu maar op voordat wij lekker snel een abusereport sturen naar je ISP!"
    );
  }

  // Auth gate for protected routes
  const authResponse = await middlewareAuth(request);
  if (authResponse) return authResponse;

  // CSP header
  const cspHeader = process.env.DISABLE_CSP
    ? ""
    : `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.cloudflare.com https://*.sentry.io https://*.google.com;
    worker-src 'self' blob:;
    ${process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? "frame-src 'self' https://challenges.cloudflare.com;" : ""}
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: *;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' https://*.cloudflare.com https://*.sentry.io https://*.google.com *;
    upgrade-insecure-requests;`.replace(/\s{2,}/g, " ").trim();

  const resp = NextResponse.next();

  resp.headers.set("Content-Security-Policy", cspHeader);
  resp.headers.set("Content-Security-Policy-Report-Only", cspHeader);
  resp.headers.set("X-Content-Type-Options", "nosniff");
  resp.headers.set("Access-Control-Allow-Origin", "*");
  resp.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  resp.headers.set("X-Frame-Options", "DENY");
  resp.headers.set("X-XSS-Protection", "1; mode=block");
  resp.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  return resp;
}

async function middlewareAuth(request: NextRequest): Promise<NextResponse | null> {
  const isPrefetch =
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("Next-Router-Prefetch") === "1";
  const isRSC =
    request.headers.get("RSC") === "1" ||
    request.nextUrl.searchParams.has("_rsc");
  if (isPrefetch || isRSC || request.headers.has("Next-Url")) {
    return null; // Allow through; main middleware will continue
  }

  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/home") || path.startsWith("/learn");
  if (!isProtected) return null;

  const sessionCookie = request.cookies.get("polarlearn.session-id");
  if (!sessionCookie?.value) {
    const redirect = NextResponse.redirect(new URL("/auth/sign-in", request.url));
    if (!request.headers.get("Next-Router-Prefetch")) {
      redirect.cookies.set("polarlearn.goto", path, {
        path: "/",
        maxAge: 10 * 60,
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }
    return redirect;
  }

  try {
    const sessionId = await decodeCookie(sessionCookie.value);
    if (!sessionId && !request.headers.get("Next-Url")) {
      const redirect = NextResponse.redirect(new URL("/auth/sign-in", request.url));
      if (!request.headers.get("Next-Router-Prefetch")) {
        redirect.cookies.set("polarlearn.goto", path, {
          path: "/",
          maxAge: 10 * 60,
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      }
      return redirect;
    }

    const session = await prisma.session.findUnique({
      where: { sessionID: sessionId as string },
    });

    if (!session || session.expires < new Date()) {
      const redirect = NextResponse.redirect(new URL("/auth/sign-in", request.url));
      if (!request.headers.get("Next-Router-Prefetch")) {
        redirect.cookies.set("polarlearn.goto", path, {
          path: "/",
          maxAge: 10 * 60,
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      }
      return redirect;
    }

    return null; // Auth OK
  } catch (error) {
    console.error("Authentication error in middleware:", error);
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }
}

export const config = {
  matcher: ["/:path*"]
};
