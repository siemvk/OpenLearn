import LearnTool from "@/components/learning/LearnTool";
import { ListStoreProvider } from "@/components/learning/ListStoreProvider";
import HeaderLearnTool from "@/components/navbar/learntToolHeader";
import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface ListItem {
  "1": string;
  "2": string;
  id?: number;
  options?: string[];
}

interface List {
  list_id: string;
  name: string;
  mode: string;
  subject: string;
  lang_from: string;
  lang_to: string;
  data: ListItem[];
  creator: string;
  createdAt?: string;
  updatedAt?: string;
  published: boolean;
}

interface SessionPageParams {
  params: Promise<{ sessionid: string }>;
}

export default async function SessionPage({ params }: SessionPageParams) {
  const { sessionid } = await params;

  if (!sessionid) {
    redirect('/home/start');
  }

  // Get user session
  const sessionCookie = (await cookies()).get('polarlearn.session-id')?.value;
  if (!sessionCookie) {
    redirect('/auth/login');
  }

  const user = await getUserFromSession(sessionCookie);
  if (!user) {
    redirect('/auth/login');
  }

  // Load the custom session by sessionId
  const existingSession = await prisma.learnSession.findFirst({
    where: {
      userId: user.id,
      sessionId: sessionid,
      isCompleted: false
    }
  });

  if (!existingSession) {
    redirect('/home/start');
  }

  // Get the word data from the session
  // Use remainingWords if available, otherwise fall back to originalWords
  let parsedData: ListItem[] = [];

  // Debug logging
  console.log('Session data:', {
    sessionId: existingSession.sessionId,
    hasRemainingWords: !!existingSession.remainingWords,
    remainingWordsLength: Array.isArray(existingSession.remainingWords) ? existingSession.remainingWords.length : 0,
    hasOriginalWords: !!existingSession.originalWords,
    originalWordsLength: Array.isArray(existingSession.originalWords) ? (existingSession.originalWords as any[]).length : 0,
  });

  // Try remainingWords first (for resuming sessions)
  if (Array.isArray(existingSession.remainingWords) && existingSession.remainingWords.length > 0) {
    parsedData = (existingSession.remainingWords as any[]).filter((item: any) =>
      item && typeof item === 'object' &&
      typeof item["1"] === 'string' &&
      typeof item["2"] === 'string'
    );
  }

  // If remainingWords is empty, use originalWords (fresh session or completed session being restarted)
  if (parsedData.length === 0 && Array.isArray(existingSession.originalWords)) {
    parsedData = (existingSession.originalWords as any[]).filter((item: any) =>
      item && typeof item === 'object' &&
      typeof item["1"] === 'string' &&
      typeof item["2"] === 'string'
    );
  }

  console.log('Parsed data length:', parsedData.length);

  // If still no data, this session might be from before we added originalWords
  // In that case, we should redirect to home as the session is not usable
  if (parsedData.length === 0) {
    console.error('No word data found in session:', existingSession.sessionId);
    redirect('/home/start');
  }

  // Session restoration data
  const restoredScore = existingSession.score as { correct: number; wrong: number } | undefined;
  const restoredAnswerLog = existingSession.answerLog as any[] | undefined;
  const restoredIncorrectAnswerLog = existingSession.incorrectAnswerLog as any[] | undefined;
  const restoredOriginalWordCount = existingSession.originalWordCount;
  const restoredOriginalQueueLength = existingSession.originalQueueLength;
  const flipQuestionLang = existingSession.flipQuestionLang || false;

  // Apply question language flipping if needed
  let finalData = parsedData;
  if (flipQuestionLang) {
    finalData = parsedData.map(item => ({
      "1": item["2"],
      "2": item["1"],
      ...(item.id !== undefined && { id: item.id })
    }));
  }

  // Shuffle the data
  const shuffledData = [...finalData].sort(() => Math.random() - 0.5);

  // Get the method from the session
  const method = existingSession.method || existingSession.mode;

  // If the method is multichoice, precompute options
  const itemsWithOptions: ListItem[] = (method === 'multichoice')
    ? shuffledData.map((item, idx, arr) => {
      const allAnswers = arr.map(i => i["2"]).filter(a => a !== item["2"]);
      const shuffled = allAnswers.sort(() => Math.random() - 0.5);
      const numOptions = Math.min(4, arr.length);
      const distractors = shuffled.slice(0, Math.max(0, numOptions - 1));
      const options = [...distractors];
      const insertAt = Math.floor(Math.random() * (options.length + 1));
      options.splice(insertAt, 0, item["2"]);
      return { ...item, options };
    })
    : shuffledData;

  const list: List = {
    list_id: existingSession.listId,
    name: existingSession.listId,
    mode: existingSession.mode,
    subject: existingSession.subject || 'CUSTOM',
    lang_from: existingSession.lang_from || 'NL',
    lang_to: existingSession.lang_to || 'NL',
    data: itemsWithOptions,
    creator: 'user',
    published: false
  };

  let learnListQueue: { word: string; mode: string; answer: string; mcOpts?: string[] }[] = [];

  // Restore the queue from session if it exists AND is not empty, otherwise build a new one for learnlist
  if (existingSession.learnListQueue && Array.isArray(existingSession.learnListQueue) && existingSession.learnListQueue.length > 0) {
    learnListQueue = existingSession.learnListQueue as any[];
    console.log('Restored learnListQueue from session, length:', learnListQueue.length);
  } else if (method === 'learnlist') {
    console.log('Building new learnListQueue for method:', method);
    // Build learnlist queue
    for (let i = 0; i < list.data.length; i++) {
      const correctAnswer = list.data[i]["2"];

      // Generate multichoice options
      const allAnswers = list.data.map(item => item["2"]).filter(a => a !== correctAnswer);
      const shuffled = allAnswers.sort(() => Math.random() - 0.5);
      const numOptions = Math.min(4, list.data.length);
      const distractors = shuffled.slice(0, Math.max(0, numOptions - 1));
      const mcOpts = [...distractors];
      const insertAt = Math.floor(Math.random() * (mcOpts.length + 1));
      mcOpts.splice(insertAt, 0, correctAnswer);

      learnListQueue.push({
        word: list.data[i]["1"],
        mode: "test",
        answer: correctAnswer
      });
      learnListQueue.push({
        word: list.data[i]["1"],
        mode: "hints",
        answer: correctAnswer
      });
      learnListQueue.push({
        word: list.data[i]["1"],
        mode: "mc",
        answer: correctAnswer,
        mcOpts: mcOpts
      });

      list.data[i].options = mcOpts;
    }

    // Shuffle the queue
    for (let i = learnListQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = learnListQueue[i];
      learnListQueue[i] = learnListQueue[j];
      learnListQueue[j] = tmp;
    }
  }

  console.log('Final state:', {
    listDataLength: list.data.length,
    method,
    learnListQueueLength: learnListQueue.length,
    hasScore: !!restoredScore,
    scoreValue: restoredScore
  });

  // Calculate the correct originalQueueLength
  // If we rebuilt the queue, use the current queue length
  // Otherwise, use the restored value
  const originalQueueLength = (method === 'learnlist' && learnListQueue.length > 0)
    ? (restoredOriginalQueueLength || learnListQueue.length)
    : restoredOriginalQueueLength;

  return (
    <ListStoreProvider initialData={{
      list,
      method,
      flipQuestionLang,
      sessionId: sessionid,
      learnListQueue,
      score: restoredScore,
      answerLog: restoredAnswerLog,
      incorrectAnswerLog: restoredIncorrectAnswerLog,
      originalWordCount: restoredOriginalWordCount,
      originalQueueLength
    }}>
      <div className="min-h-screen flex flex-col">
        <HeaderLearnTool />
        <div className="flex-1 flex items-center justify-center p-4">
          <LearnTool />
        </div>
      </div>
    </ListStoreProvider>
  );
}

