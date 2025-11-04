"use client";

import React from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserDataProvider } from "../store/user/UserDataProvider";
import { StreakProvider } from "@/store/streak/StreakProvider";
import { WSProvider } from "../components/ws-provider";
import ToastProvider from "@/components/toast/toast";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import ImpersonationCheck from "@/components/ImpersonationCheck";
import ImpersonationStyles from "@/components/ImpersonationStyles";
import { TopNavBar } from "@/components/navbar/TopNavBar";
import { SysMsgProvider } from "@/store/sysmsg/SysMsgProvider";
import { MessageBanner } from "@/components/messageBanner";

// Removed tour steps

interface ProvidersProps {
  children: React.ReactNode;
  userData: {
    id: string;
    name: string;
    email: string;
    image: string;
    isAdmin: boolean;
    impersonation: any;
  };
  streakData: any;
  footerContent: React.ReactNode;
}

export default function Providers({
  children,
  userData,
  streakData,
  footerContent,
  sysMsgData, // <-- add prop for sysMsgData
}: ProvidersProps & { sysMsgData: any }) {
  return (
    <UserDataProvider userData={userData}>
      <SysMsgProvider sysMsgData={sysMsgData}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="polarlearn.theme"
        >
          <ToastProvider>
            <StreakProvider streakData={streakData}>
              <WSProvider>
                <ImpersonationCheck />
                <ImpersonationStyles />
                <MessageBanner />
                <TopNavBar isAdmin={userData.isAdmin} />
                {children}
                {footerContent}
                <AnalyticsProvider />
              </WSProvider>
            </StreakProvider>
          </ToastProvider>
        </ThemeProvider>
      </SysMsgProvider>
    </UserDataProvider>
  );
}
