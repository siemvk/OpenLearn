import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import SessionAnalysisView from "./SessionAnalysisView";

interface PageParams {
  params: Promise<{ id: string; sessionid: string }>;
}

export default async function SessionDetailPage({ params }: PageParams) {
  const { id: listId, sessionid } = await params;

  // Get current user
  const sessionCookie = (await cookies()).get('polarlearn.session-id')?.value;
  if (!sessionCookie) {
    redirect('/auth/login');
  }

  const user = await getUserFromSession(sessionCookie);
  if (!user) {
    redirect('/auth/login');
  }

  // Fetch the session
  const session = await prisma.learnSession.findFirst({
    where: {
      sessionId: sessionid,
      userId: user.id,
      listId: listId,
      isCompleted: true
    },
    select: {
      id: true,
      sessionId: true,
      mode: true,
      score: true,
      grade: true,
      answerLog: true,
      incorrectAnswerLog: true,
      originalWordCount: true,
      createdAt: true,
      updatedAt: true,
      subject: true,
      lang_from: true,
      lang_to: true
    }
  });

  if (!session) {
    notFound();
  }

  // Fetch list data for context
  const listData = await prisma.practice.findFirst({
    where: {
      list_id: listId
    },
    select: {
      name: true,
      subject: true,
      data: true
    }
  });

  if (!listData) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SessionAnalysisView
        session={session}
        listName={listData.name}
        listId={listId}
      />
    </div>
  );
}
