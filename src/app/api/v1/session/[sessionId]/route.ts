import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';
import { getUserFromSession } from '@/utils/auth/auth';

// Delete a learn session by sessionId (only non-completed sessions can be deleted)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const sessionCookie = request.cookies.get('polarlearn.session-id')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromSession(sessionCookie);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find and delete the session (only non-completed sessions)
    const deletedSession = await prisma.learnSession.deleteMany({
      where: {
        sessionId: sessionId,
        userId: user.id,
        isCompleted: false  // Only allow deletion of non-completed sessions
      }
    });

    if (deletedSession.count === 0) {
      return NextResponse.json(
        { error: 'Session not found or already completed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedSession.count
    });

  } catch (error) {
    console.error('Error deleting learn session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
