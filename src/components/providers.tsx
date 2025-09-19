"use client";

import React from "react";
import { NextStepProvider, NextStep } from "nextstepjs";
import DarkCard from "@/components/DarkCard";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserDataProvider } from "../store/user/UserDataProvider";
import { StreakProvider } from "@/store/streak/StreakProvider";
import { WSProvider } from "../components/ws-provider";
import ToastProvider from "@/components/toast/toast";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import TourInitializer from "@/components/TourInitializer";
import TourNavigator from "@/components/TourNavigator";
import ImpersonationCheck from "@/components/ImpersonationCheck";
import ImpersonationStyles from "@/components/ImpersonationStyles";
import { TopNavBar } from "@/components/navbar/TopNavBar";
import { SysMsgProvider } from "@/store/sysmsg/SysMsgProvider";
import { MessageBanner } from "@/components/messageBanner";

const steps = [
  {
    tour: "mainTour",
    steps: [
      {
        icon: "📖",
        title: "Welkom bij PolarLearn!",
        content:
          (<div className="flex flex-col gap-2"><p>Welkom bij PolarLearn! Ontdek alle functionaliteiten en voordelen van PolarLearn in deze korte rondleiding.</p> <p>⚠️ Waarschuwing! PolarLearn is nog in de pre-v1 fase, dus er kunnen nog zeker nog bugs en niet-afgemaakte functies zijn! Meld een bug op onze discord of GitHub. Bedankt!</p></div>),
        selector: "", // empty selector triggers centered dialog
        showControls: true,
        showSkip: true,
      },
      {
        icon: "🧭",
        title: "Dit is de navigatiebalk",
        content:
          "Hiermee kan je snel naar verschillende delen van de website navigeren, zoals leertools, instellingen en meer.",
        selector: "#navbar",
        side: "right" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "📃",
        title: "Leren keuzelijst",
        content:
          "Beweeg je muis over de keuzelijst om naar een pagina van keuze te gaan. ",
        selector: ".lerendropdown",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "🔍",
        title: "Zoekbalk",
        content:
          "Dit is de zoekbalk. Hier kan je lijsten, samenvattingen, forumvragen en groepen vinden. Typ gewoon in wat je zoekt en dan krijg je resultaten.",
        selector: ".searchbar",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "🔥",
        title: "Reeks",
        content:
          "Hier kan je je reeks bekijken, oefen dagelijks om je reeks te behouden. Je krijgt ook een bevriezer als je drie dagen achter elkaar oefent.",
        selector: ".streak",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "🔔",
        title: "Berichten",
        content:
          "Hier kan je je berichten bekijken en beheren. Tot nu toe krijg je berichten voor als iemand je forumpost leuk vind, er op heeft geantwoord of als een administrator je vraag/antwoord heeft verwijderd.",
        selector: ".notification",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "⚙️",
        title: "Account keuzelijst",
        content: "In deze keuzelijst kan je uitloggen, en je account beheren.",
        selector: ".accountdropdown",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "💬",
        title: "Forum",
        content:
          "Klik hier om naar het forum te gaan en discussies te bekijken.",
        selector: ".forumbutton",
        side: "bottom" as const,
        showControls: false,
        showSkip: true,
      },
      {
        icon: "💬",
        title: "Forum",
        content:
          "Hier kan je vragen stellen, antwoorden geven en discussies voeren. Tegenover StudyGo, mag je hier ook chatten, zonder dat een of andere tutor dat verwijdert!",
        selector: "#pixel-area", // target the absolute pixel region
        side: "bottom" as const,
        showControls: true,
        showSkip: false,
      },
      {
        icon: "🏠",
        title: "Ga terug naar Start",
        content: "Klik hier om terug te keren naar de startpagina.",
        selector: ".startbutton",
        side: "bottom" as const,
        showControls: false,
        showSkip: true,
        clickThroughOverlay: true,
      },
      {
        icon: "📃",
        title: "Overzicht Lijsten",
        content: (
          <div className="w-full flex flex-col">
            <p>Hier komen je recent bekeken/geoefende lijsten te staan.</p>
            <p>Zo komt het eruit te zien:</p>
            <img
              src="https://cdn.polarlearn.nl/polarlearn/listpreview.png"
              alt="Overzicht lijsten"
              className="mt-4 w-60 h-auto rounded-lg"
            />
          </div>
        ),
        selector: "",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "🎉",
        title: "Klaar!",
        content:
          "Je bent klaar met de rondleiding! Je kunt nu beginnen met het gebruiken van PolarLearn.",
        selector: "",
        showControls: true,
        showSkip: true,
      },
    ],
  },
];

interface ProvidersProps {
  children: React.ReactNode;
  userData: {
    id: string;
    name: string;
    isAdmin: boolean;
    impersonation: any;
  };
  streakData: any;
  finishedTour: boolean;
  footerContent: React.ReactNode;
}

export default function Providers({
  children,
  userData,
  streakData,
  finishedTour,
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
          {!finishedTour ? (
            <NextStepProvider>
              <TourInitializer tourName="mainTour" />
              <NextStep steps={steps} cardComponent={DarkCard}>
                <TourNavigator />
                <ToastProvider>
                  <StreakProvider streakData={streakData}>
                    <WSProvider>
                      <>
                        <ImpersonationCheck />
                        <ImpersonationStyles />
                        <MessageBanner />
                        <TopNavBar isAdmin={userData.isAdmin} />
                        {children}
                      </>
                      {footerContent}
                      <AnalyticsProvider />
                    </WSProvider>
                  </StreakProvider>
                </ToastProvider>
              </NextStep>
            </NextStepProvider>
          ) : (
            <ToastProvider>
              <StreakProvider streakData={streakData}>
                <WSProvider>
                  <>
                    <ImpersonationCheck />
                    <ImpersonationStyles />
                    <MessageBanner />
                    <TopNavBar isAdmin={userData.isAdmin} />
                    {children}
                  </>
                  {footerContent}
                  <AnalyticsProvider />
                </WSProvider>
              </StreakProvider>
            </ToastProvider>
          )}
        </ThemeProvider>
      </SysMsgProvider>
    </UserDataProvider>
  );
}
