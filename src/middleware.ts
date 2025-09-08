import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { decodeCookie } from "@/utils/auth/session";
import { prisma } from "@/utils/prisma";
import { getTourState } from "./serverActions/getTourState";
import { getUserFromSession } from "./utils/auth/auth";
import { Embed, Webhook } from '@vermaysha/discord-webhook'

const webhook = new Webhook(process.env.DISCORD_WEBHOOK || '');

export async function middleware(request: NextRequest, response: NextResponse) {
  let cspHeader = "";
  if (process.env.DISABLE_CSP) {
    cspHeader = "";
  } else {
    cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' ${process.env.NEXT_PUBLIC_URL} https://*.cloudflare.com https://*.sentry.io https://*.google.com;
        worker-src 'self' blob:;
        ${process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? "frame-src 'self' https://challenges.cloudflare.com;" : ""}
        style-src 'self' 'unsafe-inline';
        img-src 'self' blob: data: *;
        font-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        connect-src 'self' ${process.env.NEXT_PUBLIC_URL} https://*.cloudflare.com https://*.sentry.io https://*.google.com *;
        upgrade-insecure-requests;`;
  }
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, " ")
    .trim();
  const requestHeaders = new Headers(request.headers);
  // Get response from auth middleware or create a new response
  const resp =
    (await middlewareAuth(request, response)) ??
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  // Apply the CSP header to the response
  resp.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);
  // Also set the Report-Only header to debug without breaking functionality
  resp.headers.set(
    "Content-Security-Policy-Report-Only",
    contentSecurityPolicyHeaderValue
  );

  resp.headers.set("X-Content-Type-Options", "nosniff");
  resp.headers.set("Access-Control-Allow-Origin", "*");
  resp.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  resp.headers.set("X-Frame-Options", "DENY");
  resp.headers.set("X-XSS-Protection", "1; mode=block");
  resp.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  if (
    request.nextUrl.pathname.endsWith("php") ||
    request.nextUrl.pathname.endsWith("phtml") ||
    request.nextUrl.pathname.endsWith("phps") ||
    request.nextUrl.pathname.endsWith("cgi") ||
    request.nextUrl.pathname.endsWith(".env") ||
    request.nextUrl.pathname.includes("/wp-") ||
    request.headers.get("user-agent")?.includes("curl") ||
    request.headers.get("user-agent")?.includes("wget") ||
    request.headers.get("user-agent")?.includes("httpie") ||
    request.headers.get("user-agent")?.includes("powershell")
  ) {
    webhook.setUsername("Iemand zit gaar te doen")
    const embed = new Embed()
      .setTitle('Automatische scanrapport')
      .addField(
        {
          name: "IP",
          value: request.headers.get("x-forwarded-for") || "Onbekend",
          inline: true
        }
      )
      .addField(
        {
          name: "useragent",
          value: request.headers.get("user-agent") || "Onbekend",
          inline: true
        }
      )
      .addField({
        name: "Geprobeerde pad",
        value: request.nextUrl.pathname,
        inline: true
      })
      .setColor('#0099ff')
      .setTimestamp()
    webhook.addEmbed(embed)
    const message = `@here
\`\`\`
[ Automatische scanrapport ]
Tijd: ${new Date().toLocaleString()}
IP: ${request.headers.get("x-forwarded-for") || "Onbekend"}
useragent: ${request.headers.get("user-agent") || "Onbekend"}
Geprobeerde pad: ${request.nextUrl.pathname}

[ Automatisch gegenereerd door PolarLearn ]
\`\`\``
    webhook.setContent(message).send()
    return new NextResponse("Foei kutbot!! Tyf nu maar op voordat wij lekker snel een abusereport sturen naar je ISP!")
  }

  const { finishedTour } = await getTourState();
  if (
    !finishedTour &&
    request.nextUrl.pathname !== "/home/start" &&
    !request.nextUrl.pathname.startsWith("/api") &&
    !request.headers.get("Next-Url") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    request.nextUrl.pathname !== "/" &&
    await getUserFromSession(request.cookies.get("polarlearn.session-id")?.value)
  ) {
    return NextResponse.redirect(new URL("/home/start", request.url));
  }

  return resp;
}

async function middlewareAuth(request: NextRequest, response: NextResponse) {
  // Skip authentication entirely for prefetch, RSC or Next-Url requests
  const isPrefetch =
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("Next-Router-Prefetch") === "1";
  const isRSC =
    request.headers.get("RSC") === "1" ||
    request.nextUrl.searchParams.has("_rsc");
  if (isPrefetch || isRSC || request.headers.has("Next-Url")) {
    return NextResponse.next();
  }

  if (
    request.nextUrl.pathname.startsWith("/home") ||
    request.nextUrl.pathname.startsWith("/learn")
  ) {
    // Get the cookie directly from the request instead of using cookies()
    const sessionCookie = request.cookies.get("polarlearn.session-id");

    if (!sessionCookie?.value) {
      const response = NextResponse.redirect(
        new URL("/auth/sign-in", request.url)
      );

      // Don't set goto cookie for prefetch requests
      if (!request.headers.get("Next-Router-Prefetch")) {
        response.cookies.set("polarlearn.goto", request.nextUrl.pathname, {
          path: "/",
          maxAge: 10 * 60, // 10 minutes
          httpOnly: false, // Allow client-side access
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      } else return;

      return response;
    }

    try {
      const sessionId = await decodeCookie(sessionCookie.value);

      if (!sessionId && !request.headers.get("Next-Url")) {
        const response = NextResponse.redirect(
          new URL("/auth/sign-in", request.url)
        );

        // Don't set goto cookie for prefetch requests
        if (!request.headers.get("Next-Router-Prefetch")) {
          response.cookies.set("polarlearn.goto", request.nextUrl.pathname, {
            path: "/",
            maxAge: 10 * 60, // 10 minutes
            httpOnly: false, // Allow client-side access
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          });
        }

        return response;
      }

      const session = await prisma.session.findUnique({
        where: { sessionID: sessionId as string },
      });

      if (!session || session.expires < new Date()) {
        const response = NextResponse.redirect(
          new URL("/auth/sign-in", request.url)
        );

        // Don't set goto cookie for prefetch requests
        if (!request.headers.get("Next-Router-Prefetch")) {
          response.cookies.set("polarlearn.goto", request.nextUrl.pathname, {
            path: "/",
            maxAge: 10 * 60, // 10 minutes
            httpOnly: false, // Allow client-side access
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          });
        }

        return response;
      }

      // Session is valid, allow the request
      return NextResponse.next();
    } catch (error) {
      console.error("Authentication error in middleware:", error);
      return NextResponse.redirect(new URL("/auth/sign-in", request.url));
    }
  }
}
export const config = {
  runtime: "nodejs",
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|_next/static/media|_next/static/chunks|favicon.ico|.*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

