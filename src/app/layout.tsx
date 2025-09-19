import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/footer/Footer";
import { Geist } from "next/font/google";
import Head from "next/head";
import SessionWrapper from "@/components/SessionWrapper";
import React from "react";
import { cookies } from "next/headers";
import { getTourState } from "@/serverActions/getTourState";
import { decodeCookie } from "@/utils/auth/session";
import { prisma } from "@/utils/prisma";
import { getImpersonationData } from "@/utils/auth/getImpersonationData";
import { getStreakData } from "@/serverActions/getStreakData";
import Providers from "@/components/providers";
import DelWindowNext from "@/components/DelWindowNext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "PolarLearn",
    description:
      "PolarLearn is de gratis en Open-Source leerprogramma, gemaakt voor, en door studenten.",
    authors: [
      { name: "andrei1010", url: "https://andrei1010.me" },
      { name: "siemvk", url: "https://siemvk.nl/" },
    ],
    icons: [
      {
        url: `${process.env.NEXT_PUBLIC_URL}/icon.png`,
        type: "image/png",
        rel: "icon",
      },
    ],
    keywords: [
      "PolarLearn",
      "Leerprogramma",
      "StudyGo",
      "leren",
      "studeren",
      "studie",
      "school",
      "studenten",
      "gratis",
      "open-source",
      'foss',
      "forum",
      "samenvattingen",
      "lijsten",
      "groepen",
    ],
    creator: "andrei1010",
    openGraph: {
      type: "website",
      locale: "nl_NL",
      url: "https://polarlearn.nl",
      title: "PolarLearn",
      description:
        "PolarLearn is het gratis en Open-Source leerprogramma, gemaakt voor, en door studenten.",
      siteName: "PolarLearn",
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_URL}/banner.png`,
          width: 1200,
          height: 630,
          alt: "PolarLearn banner dingo",
        },
      ],
    },
    manifest: "/manifest.json",
    applicationName: "PolarLearn",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "PolarLearn",
    },
    formatDetection: {
      telephone: false,
    },
  };
}
export const viewport = {
  themeColor: "#38bdf8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { finishedTour } = await getTourState();
  const art = `                                          
                                               __ 
     _____     _         __                   |  |
    |  _  |___| |___ ___|  |   ___ ___ ___ ___|  |
    |   __| . | | .'|  _|  |__| -_| .'|  _|   |__|
    |__|  |___|_|__,|_| |_____|___|__,|_| |_|_|__|


    <!-- 

        Hallo daar, developer!
    
        Voel je vrij om in de gegenereerde HTML-code te kijken. 
        
        De jsx-* classes zijn client-componenten, dus interactief. De rest van de classes zijn van TailwindCSS.

        PolarLearn is FOSS, dus je kunt de code bekijken op GitHub: https://github.com/polarnl/polarlearn

        Groetjes, andrei1010 en de rest van het PolarLearn team

    -->
    `;

  const footerContent = await Footer();

  // Server-side user data hydration
  let userData: { id: string; name: string; isAdmin: boolean; impersonation: any } = { id: '', name: '', isAdmin: false, impersonation: null };
  try {
    const cookie = (await cookies()).get('polarlearn.session-id')?.value;
    if (cookie) {
      const sessionId = await decodeCookie(cookie);
      if (sessionId) {
        const session = await prisma.session.findFirst({
          where: { sessionID: sessionId as string }
        });
        if (session && session.userId) {
          const user = await prisma.user.findUnique({
            where: { id: session.userId }
          });
          if (user) {
            userData = {
              id: user.id,
              name: user.name || '',
              isAdmin: user.role === 'admin',
              impersonation: null,
            };
          }
        }
      }
    }

    // Check for impersonation data during SSR
    const impersonationData = await getImpersonationData();
    if (impersonationData) {
      userData.impersonation = impersonationData;
    }
  } catch (e) {
    // fallback: keep userData as default
  }


  // Server-side streak data hydration
  const streakData = await getStreakData();

  // Server-side system message hydration from config collection
  let sysMsgData = { message: '', color: 'info' };
  try {
    const sysMsgConfig = await prisma.config.findUnique({ where: { key: 'systemMessage' } });
    if (sysMsgConfig && sysMsgConfig.value) {
      // Expecting value to be a JSON string: { message: string, color: string }
      try {
        const parsed = JSON.parse(sysMsgConfig.value);
        sysMsgData = {
          message: parsed.message || '',
          color: parsed.color || 'info',
        };
      } catch (e) {
        // fallback: treat as plain string
        sysMsgData = { message: sysMsgConfig.value, color: 'info' };
      }
    }
  } catch (e) {
    // fallback: keep sysMsgData as default
  }

  // Compute a stable key for this message and respect per-message dismissal via cookie.
  // New messages will show again because the key is derived from message + color.
  try {
    const c = await cookies();
    const currentRaw = `${sysMsgData.message}|${sysMsgData.color}`;
    const currentKey = encodeURIComponent(currentRaw);
    const dismissedRaw = c.get('polarlearn.sysmsg_dismissed')?.value;
    const dismissed = (() => {
      try { return dismissedRaw ? decodeURIComponent(dismissedRaw) : undefined; } catch { return dismissedRaw; }
    })();
    if (dismissed && dismissed === currentRaw) {
      sysMsgData = { message: '', color: sysMsgData.color, key: currentKey } as any;
    } else {
      sysMsgData = { ...sysMsgData, key: currentKey } as any;
    }
  } catch {
    // even if cookie fails, still pass key for client-side usage
    sysMsgData = { ...sysMsgData, key: encodeURIComponent(`${sysMsgData.message}|${sysMsgData.color}`) } as any;
  }

  return (
    <html
      lang="nl"
      className={`${geistSans.className} antialiased`}
      suppressHydrationWarning
    >
      <Head>
        {/* Inline theme script FIRST to prevent flicker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('polarlearn.theme') || 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {
                  // fallback to dark theme
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                }
              })();
            `,
          }}
        />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </Head>
      <body className="antialiased flex flex-col min-h-screen">
        <noscript>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black text-white text-center p-4">
            <div className="flex flex-col items-center">
              <p className="text-6xl pb-4">❌</p>
              <p className="text-xl">
                PolarLearn werkt niet zonder JavaScript. Zet JavaScript aan om
                verder te gaan.
              </p>
            </div>
          </div>
        </noscript>
        <div
          style={{ display: "none" }}
          dangerouslySetInnerHTML={{ __html: art }}
        />
        <SessionWrapper>
          <Providers
            userData={userData}
            streakData={streakData}
            finishedTour={finishedTour}
            footerContent={footerContent}
            sysMsgData={sysMsgData}
          >
            {children}
            <DelWindowNext />
          </Providers>
        </SessionWrapper>
      </body>
    </html>
  );
}
