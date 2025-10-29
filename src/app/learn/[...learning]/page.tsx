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
  id?: number; // Optional id field from database
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

export default async function LearningPages({ params }: { params: Promise<{ learning: string[] }> }) {
  const [method, listIdOrSessionId] = (await params).learning;

  // Validate the learning method
  const validMethods = ['learnlist', 'multichoice', 'hints', 'test', 'mind'];
  if (!method || !validMethods.includes(method)) {
    redirect('/home/start');
  }

  if (!listIdOrSessionId) {
    redirect('/home/start');
  }

  // Check if this is a custom session (starts with 'session-')
  const isCustomSession = listIdOrSessionId.startsWith('session-');
  let sessionId: string | null = null;
  let listId: string;

  if (isCustomSession) {
    // For custom sessions, the format is: session-{uuid}
    sessionId = listIdOrSessionId.replace('session-', '');
    listId = 'custom-session'; // Placeholder, will be replaced by actual session data
  } else {
    listId = listIdOrSessionId;
  }

  // Fetch the list data from the database (skip for custom sessions as data is in the session)
  let listData: any = null;

  if (!isCustomSession) {
    listData = await prisma.practice.findFirst({
      where: {
        list_id: listId
      },
    });

    if (!listData) {
      redirect('/home/start');
    }
  }  // Get user session and check for existing learn session
  let flipQuestionLang = false;
  let existingSession = null;

  try {
    const user = await getUserFromSession(
      (await cookies()).get('polarlearn.session-id')?.value as string
    );

    if (user) {
      if (!isCustomSession) {
        // Only load user preferences for regular lists
        const userData = await prisma.user.findUnique({
          where: { id: user.id },
          select: { list_data: true }
        });

        const listPrefs = (userData?.list_data as any)?.prefs?.[listId];
        flipQuestionLang = Boolean(listPrefs?.flipQuestionLang);

        // Check for existing active learn session for this list and user
        existingSession = await prisma.learnSession.findFirst({
          where: {
            userId: user.id,
            listId: listId,
            mode: method,
            isCompleted: false  // Only check if not completed, ignore isPaused
          },
          orderBy: {
            lastActiveAt: 'desc'
          }
        });
      } else {
        // For custom sessions, load the session by sessionId only (don't filter by listId)
        existingSession = await prisma.learnSession.findFirst({
          where: {
            userId: user.id,
            sessionId: sessionId!,
            isCompleted: false
          }
        });

        if (!existingSession) {
          // Custom session not found, redirect to home
          redirect('/home/start');
        }

        // Update listId to match the session's listId for display purposes
        listId = existingSession.listId;
      }
    }
  } catch (error) {
    console.warn('Could not load user preferences or session:', error);
    // Continue with default preferences (flipQuestionLang = false)
  }

  // Get the list data directly - Prisma handles JSON parsing
  let parsedData: ListItem[] = [];

  if (!isCustomSession && listData) {
    parsedData = Array.isArray(listData.data)
      ? (listData.data as any[]).filter((item: any) =>
        item && typeof item === 'object' &&
        typeof item["1"] === 'string' &&
        typeof item["2"] === 'string'
      )
      : [];
  } else if (isCustomSession && existingSession) {
    // For custom sessions, get the data from the session's remainingWords
    parsedData = Array.isArray(existingSession.remainingWords)
      ? (existingSession.remainingWords as any[]).filter((item: any) =>
        item && typeof item === 'object' &&
        typeof item["1"] === 'string' &&
        typeof item["2"] === 'string'
      )
      : [];
  }

  // Session restoration data
  let restoredScore: { correct: number; wrong: number } | undefined;
  let restoredAnswerLog: any[] | undefined;
  let restoredIncorrectAnswerLog: any[] | undefined;
  let restoredOriginalWordCount: number | undefined;
  let restoredOriginalQueueLength: number | undefined;

  if (existingSession && existingSession.remainingWords) {
    // Restore from session
    parsedData = existingSession.remainingWords as any as ListItem[];
    restoredScore = existingSession.score as any;
    restoredAnswerLog = existingSession.answerLog as any;
    restoredIncorrectAnswerLog = existingSession.incorrectAnswerLog as any;
    restoredOriginalWordCount = existingSession.originalWordCount;
    restoredOriginalQueueLength = existingSession.originalQueueLength;

    // Override flipQuestionLang with session value if it exists
    if (existingSession.flipQuestionLang !== undefined) {
      flipQuestionLang = existingSession.flipQuestionLang;
    }
  }

  // Apply question language flipping if preference is enabled (only if not restoring from session)
  if (flipQuestionLang && !existingSession) {
    parsedData = parsedData.map(item => ({
      "1": item["2"],
      "2": item["1"],
      ...(item.id !== undefined && { id: item.id })
    }));
  }

  // Shuffle the data server-side for consistent SSR (skip if restoring from session)
  const shuffledData = existingSession
    ? parsedData  // Don't shuffle if restoring - keep the session's exact state
    : [...parsedData].sort(() => Math.random() - 0.5);

  // If the selected method is multichoice, precompute options for each item server-side
  // Skip this if we're restoring from a session (options already attached)
  const itemsWithOptions: ListItem[] = (method === 'multichoice' && !existingSession)
    ? shuffledData.map((item, idx, arr) => {
      // gather all other answers as distractors
      const allAnswers = arr.map(i => i["2"]).filter(a => a !== item["2"]);
      // shuffle distractors
      const shuffled = allAnswers.sort(() => Math.random() - 0.5);
      // pick up to 3 distractors (or fewer if list is small)
      const numOptions = Math.min(4, arr.length);
      const distractors = shuffled.slice(0, Math.max(0, numOptions - 1));
      // Insert correct answer at random position
      const options = [...distractors];
      const insertAt = Math.floor(Math.random() * (options.length + 1));
      options.splice(insertAt, 0, item["2"]);
      return { ...item, options };
    })
    : shuffledData;

  const list: List = isCustomSession && existingSession ? {
    list_id: existingSession.listId, // Use the custom name from the session
    name: existingSession.listId, // Display the custom name
    mode: existingSession.mode,
    subject: existingSession.subject || 'CUSTOM',
    lang_from: existingSession.lang_from || 'NL',
    lang_to: existingSession.lang_to || 'NL',
    data: itemsWithOptions,
    creator: 'user',
    published: false
  } : {
    list_id: listData!.list_id,
    name: listData!.name,
    mode: listData!.mode || 'list',
    subject: listData!.subject,
    lang_from: listData!.lang_from || 'NL',
    lang_to: listData!.lang_to || 'NL',
    data: itemsWithOptions,
    creator: listData!.creator,
    createdAt: listData.createdAt?.toISOString(),
    updatedAt: listData.updatedAt?.toISOString(),
    published: listData.published
  };

  let learnListQueue: { word: string; mode: string; answer: string; mcOpts?: string[] }[] = [];

  // Restore the queue from session if it exists, otherwise build a new one
  // Only build the queue for learnlist mode
  if (method === 'learnlist') {
    if (existingSession && existingSession.learnListQueue) {
      learnListQueue = existingSession.learnListQueue as any;
    } else {
      // Build new queue for learnlist mode
      for (let i = 0; i < list.data.length; i++) {
        // Server-side: build unique multiple-choice options and always include the correct answer
        const correctAnswer = list.data[i]["2"];
        const desiredCount = Math.min(4, list.data.length);
        const optsSet = new Set<string>();
        optsSet.add(correctAnswer);
        // Fill the set with random other answers until we have the desired count
        let attempts = 0;
        while (optsSet.size < desiredCount && attempts < 50) {
          const r = Math.floor(Math.random() * list.data.length);
          optsSet.add(list.data[r]["2"]);
          attempts++;
        }
        const mcOpts = Array.from(optsSet);
        // Shuffle
        for (let k = mcOpts.length - 1; k > 0; k--) {
          const j = Math.floor(Math.random() * (k + 1));
          const tmp = mcOpts[k];
          mcOpts[k] = mcOpts[j];
          mcOpts[j] = tmp;
        }

        learnListQueue.push({
          word: list.data[i]["1"],
          mode: "test",
          answer: correctAnswer
        })
        learnListQueue.push({
          word: list.data[i]["1"],
          mode: "hints",
          answer: correctAnswer
        })
        learnListQueue.push({
          word: list.data[i]["1"],
          mode: "mc",
          answer: correctAnswer,
          mcOpts: mcOpts
        })

        // Also attach options to the list item so the server-rendered currentWord has options
        list.data[i].options = mcOpts;
      }
      // Shuffle the learnListQueue using Fisher-Yates to ensure random order
      for (let i = learnListQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = learnListQueue[i];
        learnListQueue[i] = learnListQueue[j];
        learnListQueue[j] = tmp;
      }
    }
  }

  return (
    <ListStoreProvider initialData={{
      list,
      method,
      flipQuestionLang,
      sessionId: isCustomSession && sessionId ? sessionId : undefined,
      learnListQueue,
      score: restoredScore,
      answerLog: restoredAnswerLog,
      incorrectAnswerLog: restoredIncorrectAnswerLog,
      originalWordCount: restoredOriginalWordCount,
      originalQueueLength: restoredOriginalQueueLength
    }}>
      <div className="min-h-screen flex flex-col">
        <HeaderLearnTool />
        <div className="flex-1 flex items-center justify-center p-4">
          <LearnTool />
        </div>
      </div>
    </ListStoreProvider>
  )
}