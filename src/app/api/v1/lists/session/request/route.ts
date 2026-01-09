import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';
import { getUserFromSession } from '@/utils/auth/auth';
import { v4 as uuidv4 } from 'uuid';

interface WordData {
  "1": string;  // Question
  "2": string;  // Answer
  id: number;
}

interface CreateSessionRequest {
  words: WordData[];
  subject: string;
  lang_from: string;
  lang_to: string;
  mode?: string;
  method?: string;
  flipQuestionLang?: boolean;
  name?: string;
}

// Create a new learn session from provided word data
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('polarlearn.session-id')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromSession(sessionCookie);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateSessionRequest = await request.json();
    const {
      words,
      subject,
      lang_from,
      lang_to,
      mode = 'test',
      method = 'test',
      flipQuestionLang = false,
      name
    } = body;

    // Validate required fields
    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: 'Words array is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!subject || !lang_from || !lang_to) {
      return NextResponse.json(
        { error: 'Subject and languages (lang_from, lang_to) are required' },
        { status: 400 }
      );
    }

    // Validate word structure
    for (const word of words) {
      if (!word["1"] || !word["2"] || typeof word.id !== 'number') {
        return NextResponse.json(
          { error: 'Invalid word structure. Each word must have "1", "2", and id properties' },
          { status: 400 }
        );
      }
    }

    // Generate a unique session ID
    const sessionId = uuidv4();

    const sessionName = name ? name : `Custom Session ${new Date().toLocaleDateString()}`;

    // Create the session
    const session = await prisma.learnSession.create({
      data: {
        sessionId,
        userId: user.id,
        listId: sessionName,
        mode,
        method,
        subject,
        lang_from,
        lang_to,
        flipQuestionLang,
        currentWordIndex: 0,
        remainingWords: words as any,
        originalWords: words as any, // Store original words separately
        learnListQueue: [],
        originalWordCount: words.length,
        originalQueueLength: 0,
        score: {
          correct: 0,
          wrong: 0
        },
        answerLog: [],
        incorrectAnswerLog: [],
        lastWord: null,
        lastAnswer: null,
        grade: null,
        isPaused: false,
        isCompleted: false
      }
    });

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
