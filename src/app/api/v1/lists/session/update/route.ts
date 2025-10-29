import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';
import { getUserFromSession } from '@/utils/auth/auth';

// Calculate grade based on score
// Returns a value between 1 and 10 (Dutch grading system)
// Formula: [punten behaald]/[totaal punten] * 9 + 1
function calculateGrade(score: any): number | null {
  if (!score || typeof score !== 'object') {
    return null;
  }

  const correct = Number(score.correct) || 0;
  const wrong = Number(score.wrong) || 0;
  const total = correct + wrong;

  if (total === 0) {
    return null; // No questions answered yet
  }

  // Formula: (correct / total) * 9 + 1
  // This gives: 0% = 1.0, 50% = 5.5, 100% = 10.0
  const grade = (correct / total) * 9 + 1;

  // Round to 1 decimal place
  return Math.round(grade * 10) / 10;
}

interface UpdateSessionRequest {
  sessionId: string;
  currentWordIndex?: number;
  remainingWords?: any[];
  learnListQueue?: any[];
  score?: {
    correct: number;
    wrong: number;
  };
  answerLog?: any[];
  incorrectAnswerLog?: any[];
  lastWord?: any;
  lastAnswer?: any;
  isPaused?: boolean;
  isCompleted?: boolean;
}

// Update an existing custom learn session
export async function PATCH(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('polarlearn.session-id')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromSession(sessionCookie);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateSessionRequest = await request.json();
    const {
      sessionId,
      currentWordIndex,
      remainingWords,
      learnListQueue,
      score,
      answerLog,
      incorrectAnswerLog,
      lastWord,
      lastAnswer,
      isPaused,
      isCompleted
    } = body;

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Find the session and verify it belongs to the user
    const existingSession = await prisma.learnSession.findFirst({
      where: {
        sessionId: sessionId,
        userId: user.id
      }
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Calculate grade from score if provided
    const calculatedGrade = score ? calculateGrade(score) : undefined;

    // Build update data object with only provided fields
    const updateData: any = {
      lastActiveAt: new Date()
    };

    if (currentWordIndex !== undefined) updateData.currentWordIndex = currentWordIndex;
    if (remainingWords !== undefined) updateData.remainingWords = remainingWords;
    if (learnListQueue !== undefined) updateData.learnListQueue = learnListQueue;
    if (score !== undefined) updateData.score = score;
    if (answerLog !== undefined) updateData.answerLog = answerLog;
    if (incorrectAnswerLog !== undefined) updateData.incorrectAnswerLog = incorrectAnswerLog;
    if (lastWord !== undefined) updateData.lastWord = lastWord;
    if (lastAnswer !== undefined) updateData.lastAnswer = lastAnswer;
    if (isPaused !== undefined) updateData.isPaused = isPaused;
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
    if (calculatedGrade !== undefined) updateData.grade = calculatedGrade;

    // Update the session
    const updatedSession = await prisma.learnSession.update({
      where: { id: existingSession.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        sessionId: updatedSession.sessionId,
        mode: updatedSession.mode,
        isPaused: updatedSession.isPaused,
        isCompleted: updatedSession.isCompleted,
        grade: updatedSession.grade,
        score: updatedSession.score
      }
    });

  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
