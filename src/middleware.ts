import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { decodeCookie } from "@/utils/auth/session";
import { prisma } from "@/utils/prisma";
import { getTourState } from "./serverActions/getTourState";
import { getUserFromSession } from "./utils/auth/auth";
import { Embed, Webhook } from "@vermaysha/discord-webhook";

const webhook = new Webhook(process.env.DISCORD_WEBHOOK || "");

export async function middleware(request: NextRequest) {
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

  // CSP header
  const cspHeader = process.env.DISABLE_CSP
    ? ""
    : `
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

  // Bot / scanner detection
  const userAgent = request.headers.get("user-agent") || "";
  if (
    pathname.endsWith(".php") ||
    pathname.endsWith(".phtml") ||
    pathname.endsWith(".phps") ||
    pathname.endsWith(".cgi") ||
    pathname.endsWith(".env") ||
    pathname.includes("/wp-") ||
    ["curl", "wget", "httpie", "powershell"].some((bot) =>
      userAgent.toLowerCase().includes(bot)
    )
  ) {
    const embed = new Embed()
      .setTitle("Automatische scanrapport")
      .addField({ name: "IP", value: request.headers.get("x-forwarded-for") || "Onbekend", inline: true })
      .addField({ name: "useragent", value: userAgent, inline: true })
      .addField({ name: "Geprobeerde pad", value: pathname, inline: true })
      .setColor("#0099ff")
      .setTimestamp();

    webhook.setUsername("Iemand zit gaar te doen");
    webhook.addEmbed(embed);
    webhook.setContent(`@here
\`\`\`
[ Automatische scanrapport ]
Tijd: ${new Date().toLocaleString()}
IP: ${request.headers.get("x-forwarded-for") || "Onbekend"}
useragent: ${userAgent}
Geprobeerde pad: ${pathname}

[ Automatisch gegenereerd door PolarLearn ]
\`\`\``).send();

    return new NextResponse(
      "Foei kutbot!! Tyf nu maar op voordat wij lekker snel een abusereport sturen naar je ISP!"
    );
  }

  return resp;
}

export const config = {
  runtime: "nodejs",
  matcher: ["/:path*"], // Apply middleware to all paths, skip static/API inside the function
};
