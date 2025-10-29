import type { ListStoreState } from '@/components/learning/listStore';

export async function saveLearnSession(
  listId: string,
  storeState: ListStoreState,
  isPaused: boolean = true,
  isCompleted: boolean = false,
  sessionId?: string // Optional sessionId for custom sessions
) {
  try {
    // Use mainMode (original learning mode from URL) not currentMethod (which changes during learnlist)
    const mode = storeState.mainMode || storeState.currentMethod || 'test';

    // Check if this is a custom session (has sessionId)
    const isCustomSession = !!sessionId;

    if (isCustomSession) {
      // For custom sessions, use the update endpoint
      const requestBody = {
        sessionId,
        currentWordIndex: 0,
        remainingWords: storeState.currentList?.data || [],
        learnListQueue: storeState.learnListQueue,
        score: storeState.score,
        answerLog: storeState.answerLog,
        incorrectAnswerLog: storeState.incorrectAnswerLog,
        lastWord: storeState.currentWord,
        lastAnswer: storeState.lastAnswer,
        isPaused,
        isCompleted
      };

      const response = await fetch(`/api/v1/lists/session/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to update custom session');
      }

      const data = await response.json();
      return data;
    } else {
      // For regular list sessions, use the existing endpoint
      const requestBody = {
        mode: mode,
        method: storeState.currentMethod,
        subject: storeState.currentList?.subject,
        lang_from: storeState.currentList?.lang_from,
        lang_to: storeState.currentList?.lang_to,
        flipQuestionLang: storeState.flipQuestionLang,
        currentWordIndex: 0,
        remainingWords: storeState.currentList?.data || [],
        learnListQueue: storeState.learnListQueue,
        originalWordCount: storeState.originalWordCount,
        originalQueueLength: storeState.originalQueueLength,
        score: storeState.score,
        answerLog: storeState.answerLog,
        incorrectAnswerLog: storeState.incorrectAnswerLog,
        lastWord: storeState.currentWord,
        lastAnswer: storeState.lastAnswer,
        isPaused,
        isCompleted
      };

      const response = await fetch(`/api/v1/lists/${listId}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to save session');
      }

      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('[saveLearnSession] Failed to save session:', error);
    return null;
  }
}
