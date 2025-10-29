import { ReactNode } from "react";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import Image from "next/image";
import { getSubjectIcon } from "@/components/icons";
import { TabItem } from "@/components/Tabs";
import { prisma } from "@/utils/prisma";
import { Badge } from "@/components/ui/badge";
import UserListButtons from "@/components/learning/UserListButtons";
import SessionButtons from "@/components/learning/SessionButtons";
import CreatorLink from "@/components/CreatorLink";
import Dropdown from "@/components/button/DropdownBtn";
import { getUserNameById } from '@/serverActions/getUserName';
import { isUUID } from '@/utils/uuid';
import { addToRecentLists } from "@/utils/actions/updateRecentLists";
import { addToRecentSubjects } from "@/utils/actions/updateRecentSubjects";
import ViewListHeaderTabs from "@/components/learning/ViewListHeaderTabs";

import learn from '@/app/img/learn.svg';
import test from '@/app/img/test.svg';
import hints from '@/app/img/hint.svg';
import mind from '@/app/img/mind.svg';
import livequiz from '@/app/img/livequiz.svg';

interface ViewListLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string; tab?: string[] }>;
}

export default async function ViewListLayout({ children, params }: ViewListLayoutProps) {
  const { id, tab } = await params;
  const defaultTab = tab && tab.length > 0 ? tab[0] : "woorden";

  const listData = await prisma.practice.findFirst({
    where: {
      list_id: id
    },
    select: {
      list_id: true,
      name: true,
      createdAt: true,
      creator: true,
      data: true,
      subject: true,
      lang_from: true,
      lang_to: true,
      published: true,
      updatedAt: true
    }
  });

  // Add this list to user's recent lists
  if (listData) {
    await addToRecentLists(id);

    // Also add the subject to recent subjects if available
    if (listData.subject) {
      await addToRecentSubjects(listData.subject);
    }
  }

  // Check if current user is the creator to show edit button
  const currentUser = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);
  const isCreator = (listData?.creator === currentUser?.name ||
    listData?.creator === currentUser?.id ||
    currentUser?.role === "admin");
  const isUnpublished = listData?.published === false;

  // Check for existing learn sessions for this user and list
  let existingSessions: { mode: string; lastActiveAt: Date }[] = [];
  if (currentUser && listData) {
    try {
      const sessions = await prisma.learnSession.findMany({
        where: {
          userId: currentUser.id,
          listId: id,
          isCompleted: false
        },
        select: {
          mode: true,
          lastActiveAt: true
        },
        orderBy: {
          lastActiveAt: 'desc'
        }
      });
      existingSessions = sessions;
    } catch (error) {
      console.error("Error fetching learn sessions:", error);
    }
  }

  // Prefetch creator info to avoid CSR waterfall
  let creatorName = listData?.creator || "";
  let creatorUserId: string | null = null;
  if (listData?.creator) {
    try {
      if (isUUID(listData.creator)) {
        const info = await getUserNameById(listData.creator);
        creatorName = info.name || listData.creator;
        creatorUserId = listData.creator;
      } else {
        creatorName = listData.creator;
        const { getUserIdByName } = await import("@/serverActions/getUserName");
        const userInfo = await getUserIdByName(listData.creator);
        creatorUserId = userInfo.id;
      }
    } catch (error) {
      console.error("Error fetching creator info:", error);
    }
  }

  const subject = listData?.subject || 'general';

  // Define practice options for the dropdown with styled elements
  const practiceOptions: [React.ReactNode, string][] = [
    [
      <div key="leren" className="flex items-center">
        <Image src={learn} alt="leren plaatje" width={20} height={20} className="mr-2" />
        <span className="font-medium">Leren</span>
      </div>,
      `/learn/learnlist/${id}`
    ],
    [
      <div key="toets" className="flex items-center">
        <Image src={test} alt="toets plaatje" width={20} height={20} className="mr-2" />
        <span className="font-medium">Toets</span>
      </div>,
      `/learn/test/${id}`
    ],
    [
      <div key="hints" className="flex items-center">
        <Image src={hints} alt="hints plaatje" width={20} height={20} className="mr-2" />
        <span className="font-medium">Hints</span>
      </div>,
      `/learn/hints/${id}`
    ],
    [
      <div key="mind" className="flex items-center">
        <Image src={mind} alt="mind plaatje" width={20} height={20} className="mr-2" />
        <span className="font-medium">In gedachten</span>
      </div>,
      `/learn/mind/${id}`
    ],
    [
      <div key="multichoice" className="flex items-center">
        <Image src={livequiz} alt="Meerkeuze plaatje" width={20} height={20} className="mr-2" />
        <span className="font-medium">Meerkeuze</span>
      </div>,
      `/learn/multichoice/${id}`
    ],
    [
      <div key="livequiz" className="flex items-center">
        <Image src={livequiz} alt="livequiz plaatje" width={20} height={20} className="mr-2" />
        <span className="font-medium">LiveQuiz</span>
      </div>,
      `/learn/livequiz/${id}`
    ]
  ];

  // Define tabs for this page
  const tabs: TabItem[] = [
    {
      id: 'woorden',
      label: 'Woorden',
      content: <></>,
    },
    {
      id: 'resultaten',
      label: 'Resultaten',
      content: <></>,
    }
  ];

  return (
    <div className="px-4">
      <div className="h-4" />
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <Image
              src={getSubjectIcon(subject)}
              alt="vak icon"
              width={30}
              height={30}
              className={"h-8 w-8 inline-block mr-2"}
            />
            <span
              className="whitespace-normal a- max-w-[40ch]"
            >
              {listData?.name}
            </span>
            {isUnpublished && (
              <Badge
                variant="secondary"
                className="ml-2 bg-amber-600/20 text-amber-500 border border-amber-600/50"
              >
                Concept
              </Badge>
            )}
          </h1>
          <UserListButtons listId={id} isCreator={isCreator} />
        </div>
        <div className="h-4" />
        <div className="flex flex-col gap-4">
          <div className="flex-row flex items-center">
            <p>Gemaakt door:</p>
            <div className="w-2" />
            <CreatorLink
              creator={listData?.creator || ""}
              userId={creatorUserId}
              displayName={creatorName}
            />
          </div>

          <div className="relative min-h-12">
            {existingSessions.length > 0 ? (
              <SessionButtons listId={id} sessions={existingSessions} />
            ) : (
              <Dropdown
                text="Oefenen"
                dropdownMatrix={practiceOptions}
                width={180}
                zIndex={10}
              />
            )}
          </div>
        </div>
      </div>
      <div className="pl-4">
        <ViewListHeaderTabs
          tabs={tabs}
          defaultTab={defaultTab}
          baseRoute={`/learn/viewlist/${id}`}
          listId={id}
        />
      </div>
      <div className="my-4">
        {children}
      </div>
    </div>
  );
}