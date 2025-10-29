import { prisma } from "@/utils/prisma";
import { getSubjectName, getSubjectIcon } from "@/components/icons";
import ListTableComponent from "../listTableComponent";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import ResultsView from "./ResultsView";

interface PageParams {
  params: Promise<{ id: string; tab?: string[] }>;
}

interface WordPair {
  "1": string;  // term
  "2": string;  // definition
}

// Helper function to validate if an object is a WordPair
function isWordPair(obj: any): obj is WordPair {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj["1"] === 'string' &&
    typeof obj["2"] === 'string'
  );
}

// Helper function to check if array contains WordPair objects
function isWordPairArray(arr: any[]): arr is WordPair[] {
  return arr.every(item => isWordPair(item));
}

export default async function ViewListTabPage({ params }: PageParams) {
  const { id, tab } = await params;
  const selectedTab = tab?.[0] || 'woorden';

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

  // Use the top-level subject field from the practice model
  const subject = listData?.subject || 'general';

  // Check if the subject is a language
  const isLanguageSubject = ['NL', 'EN', 'FR', 'DE'].includes(subject.toUpperCase());

  // From and To language info
  const fromLanguage = listData?.lang_from ? getSubjectName(listData.lang_from) : '';
  const toLanguage = listData?.lang_to ? getSubjectName(listData.lang_to) : '';

  // Get language icons
  const fromLanguageIcon = listData?.lang_from ? getSubjectIcon(listData.lang_from) : null;
  const toLanguageIcon = listData?.lang_to ? getSubjectIcon(listData.lang_to) : null;

  // Handle the word pairs data - could be already an object or a JSON string
  let wordPairs: WordPair[] = [];
  if (listData?.data) {
    try {
      let parsedData: any;

      // Check if data is already an object or needs parsing
      if (typeof listData.data === 'string') {
        parsedData = JSON.parse(listData.data);
      } else {
        parsedData = listData.data;
      }

      // Verify the data is an array
      if (Array.isArray(parsedData)) {
        // Type check the array elements
        if (isWordPairArray(parsedData)) {
          wordPairs = parsedData;
        } else {
          wordPairs = parsedData.filter(isWordPair);
        }
      }
    } catch (error) {
      console.error("Error processing data:", error, "Raw data:", listData.data);
    }
  }

  // Render content based on the selected tab
  if (selectedTab === 'woorden') {
    return (
      <div className="mt-4 px-4">
        {wordPairs.length > 0 ? (
          <div className="overflow-x-auto">
            <ListTableComponent
              wordPairs={wordPairs}
              edit={false}
              fromLanguage={fromLanguage}
              toLanguage={toLanguage}
              fromLanguageIcon={fromLanguageIcon}
              toLanguageIcon={toLanguageIcon}
              isLanguageSubject={isLanguageSubject}
              listId={id}
              subject={subject}
              listName={listData?.name}
            />
          </div>
        ) : (
          <p className="text-gray-500 text-center">
            Geen woorden gevonden in deze lijst :(
          </p>
        )}
      </div>
    );
  }

  if (selectedTab === 'resultaten') {
    // Fetch completed sessions for this list
    const sessionCookie = (await cookies()).get('polarlearn.session-id')?.value;
    let completedSessions: any[] = [];

    if (sessionCookie) {
      const user = await getUserFromSession(sessionCookie);

      if (user) {
        completedSessions = await prisma.learnSession.findMany({
          where: {
            userId: user.id,
            listId: id,
            isCompleted: true
          },
          orderBy: {
            createdAt: 'desc'
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
            updatedAt: true
          }
        });
      }
    }

    return (
      <div className="mt-4 px-4">
        <ResultsView sessions={completedSessions} listId={id} />
      </div>
    );
  }

  // Default fallback
  return (
    <div className="mt-4 px-4">
      <p className="text-gray-500 text-center">Tab niet gevonden</p>
    </div>
  );
}
