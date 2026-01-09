import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useContext, createContext } from 'react';
import type { StoreApi } from 'zustand/vanilla';

export interface ListItem {
  "1": string; // source term (e.g., "sum")
  "2": string; // target term (e.g., "zijn")
  id?: number; // optional id from database
  options?: string[];
}

export interface List {
  id?: string;
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

export interface AnswerLogEntry {
  word: ListItem;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timestamp: Date;
}

export interface ListStoreState {
  currentList: List | null;
  currentWord: ListItem | null;
  currentMethod: string | null;  // Changes during learnlist (test, hints, mc, etc.)
  mainMode: string | null;  // The original learning mode from URL (never changes)
  originalWordCount: number;
  originalQueueLength: number;
  flipQuestionLang: boolean;
  sessionId: string | null;  // For custom sessions
  learnListQueue: { word: string; mode: string; answer: string; mcOpts?: string[] }[] | null;
  score: { correct: number; wrong: number };
  lastAnswer: { isCorrect: boolean; userAnswer: string; correctAnswer: string } | null;
  answerLog: AnswerLogEntry[];
  incorrectAnswerLog: AnswerLogEntry[];
  shuffleList: () => void;
  setList: (list: List) => void;
  setMethod: (method: string) => void;
  setFlipQuestionLang: (flip: boolean) => void;
  setSessionId: (sessionId: string | null) => void;
  setRandomCurrentWord: () => void;
  clearCurrentWord: () => void;
  checkAnswer: (userAnswer: string) => boolean;
  answerCorrect: () => void;
  answerWrong: (userAnswer: string) => void;
  resetScore: () => void;
  clearLog: () => void;
  getCorrectWords: () => AnswerLogEntry[];
  getWrongWords: () => AnswerLogEntry[];
  // Learnlist queue management
  setLearnListQueue: (queue: { word: string; mode: string; answer: string; mcOpts?: string[] }[] | null) => void;
  dequeueLearnItem: () => void;
  // Learnlist queue management

}

// Store factory for SSR hydration
export const createListStore = (initData?: {
  list?: List;
  method?: string;
  flipQuestionLang?: boolean;
  sessionId?: string;
  learnListQueue?: { word: string, mode: string, answer: string, mcOpts?: string[] }[];
  score?: { correct: number; wrong: number };
  answerLog?: AnswerLogEntry[];
  incorrectAnswerLog?: AnswerLogEntry[];
  originalWordCount?: number;
  originalQueueLength?: number;
}) =>
  createStore<ListStoreState>((set, get) => {
    // Determine initial currentWord based on whether we're in learnlist mode
    let initialCurrentWord = null;
    let initialCurrentMethod = initData?.method || null;

    if (initData?.method === 'learnlist' && initData?.learnListQueue && initData.learnListQueue.length > 0) {
      // In learnlist mode, get the word from the first queue item
      const firstQueueItem = initData.learnListQueue[0];

      // Set currentMethod to the first queue item's mode (hints, test, mc, etc.)
      initialCurrentMethod = firstQueueItem.mode;

      const matchedWord = initData?.list?.data?.find(
        item => item["1"] === firstQueueItem.word && item["2"] === firstQueueItem.answer
      );

      if (matchedWord) {
        // If queue item has mcOpts, attach them
        initialCurrentWord = firstQueueItem.mcOpts
          ? { ...matchedWord, options: firstQueueItem.mcOpts }
          : matchedWord;
      } else {
        // Fallback: create synthetic word from queue data
        initialCurrentWord = {
          "1": firstQueueItem.word,
          "2": firstQueueItem.answer,
          ...(firstQueueItem.mcOpts ? { options: firstQueueItem.mcOpts } : {})
        };
      }
    } else {
      // For other modes, use the first word in the list data
      initialCurrentWord = initData?.list?.data?.[0] || null;
    }

    return ({
      currentList: initData?.list || null,
      currentWord: initialCurrentWord,
      currentMethod: initialCurrentMethod,
      mainMode: initData?.method || null,  // Store the original mode, never changes
      originalWordCount: initData?.originalWordCount ?? initData?.list?.data?.length ?? 0, // Track original count for progress
      originalQueueLength: initData?.originalQueueLength ?? initData?.learnListQueue?.length ?? 0, // Track original queue length for learnlist progress
      flipQuestionLang: initData?.flipQuestionLang || false,
      sessionId: initData?.sessionId || null,  // For custom sessions
      learnListQueue: initData?.learnListQueue || null,
      score: initData?.score || { correct: 0, wrong: 0 },
      lastAnswer: null,
      answerLog: initData?.answerLog || [],
      incorrectAnswerLog: initData?.incorrectAnswerLog || [],
      setSessionId: (sessionId: string | null) => set({ sessionId }),
      setLearnListQueue: (queue: { word: string; mode: string; answer: string; mcOpts?: string[] }[] | null) => set({ learnListQueue: queue }),
      dequeueLearnItem: () => {
        set((state: ListStoreState) => {
          const q = state.learnListQueue ? [...state.learnListQueue] : [];
          if (!q || q.length === 0) return state;

          // Remove the current (just answered) question
          q.shift();

          // If queue is now empty, we're done
          if (q.length === 0) {
            return {
              ...state,
              learnListQueue: q,
              currentWord: null
            } as unknown as ListStoreState;
          }

          // Get the NEXT question (new first item in queue)
          const next = q[0];

          // try to find matching ListItem in currentList
          let matched = state.currentList?.data?.find(item => item["1"] === next.word && item["2"] === next.answer) || null;

          // If the queue item provided mcOpts, attach them to the matched item or to the synthetic currentWord
          if (next.mcOpts && next.mcOpts.length > 0) {
            if (matched) {
              matched = { ...matched, options: next.mcOpts };
            }
          }

          const newCurrentWord = matched || { "1": next.word, "2": next.answer, ...(next.mcOpts ? { options: next.mcOpts } : {}) };

          return {
            ...state,
            learnListQueue: q,
            currentMethod: next.mode,
            currentWord: newCurrentWord
          } as unknown as ListStoreState;
        });
      },
      shuffleList: () => {
        set((state: ListStoreState) => ({
          ...state,
          currentList: state.currentList ? {
            ...state.currentList,
            data: [...state.currentList.data].sort(() => Math.random() - 0.5)
          } : null
        }));
      },
      setList: (list: List) => {
        set({ currentList: list, currentWord: null, score: { correct: 0, wrong: 0 }, lastAnswer: null, answerLog: [], incorrectAnswerLog: [] });
      },
      setMethod: (method: string) => {
        set({ currentMethod: method });
      },
      setFlipQuestionLang: (flip: boolean) => {
        set({ flipQuestionLang: flip });
      },
      setRandomCurrentWord: () => {
        set((state: ListStoreState) => {
          if (!state.currentList || state.currentList.data.length === 0) {
            return { ...state, currentWord: null };
          }
          // Take the first word from the list (as they're already shuffled)
          const nextWord = state.currentList.data[0];
          return { ...state, currentWord: nextWord };
        });
      },
      clearCurrentWord: () => {
        set((state: ListStoreState) => ({ ...state, currentWord: null }));
      },
      checkAnswer: (userAnswer: string) => {
        const state = get();
        if (!state.currentWord) return false;

        const correctAnswer = state.currentWord["2"].toLowerCase().trim();
        const normalizedUserAnswer = userAnswer.toLowerCase().trim();

        const correctAnswers = correctAnswer
          .split(/[/,]/)
          .map(answer => answer.trim())
          .filter(answer => answer !== '');

        const isCorrect = correctAnswers.some(answer => answer === normalizedUserAnswer);
        return isCorrect;
      },
      answerCorrect: () => {
        set((state: ListStoreState) => {
          if (!state.currentWord || !state.currentList) return state;

          const logEntry: AnswerLogEntry = {
            word: state.currentWord,
            userAnswer: state.currentWord["2"],
            correctAnswer: state.currentWord["2"],
            isCorrect: true,
            timestamp: new Date()
          };

          // Remove the correctly answered word from the list
          const newData = state.currentList.data.filter(word =>
            !(word["1"] === state.currentWord!["1"] && word["2"] === state.currentWord!["2"])
          );

          return {
            ...state,
            currentList: {
              ...state.currentList,
              data: newData
            },
            score: { ...state.score, correct: state.score.correct + 1 },
            lastAnswer: {
              isCorrect: true,
              userAnswer: state.currentWord["2"],
              correctAnswer: state.currentWord["2"]
            },
            answerLog: [...state.answerLog, logEntry]
          };
        });
      },
      answerWrong: (userAnswer: string) => {
        set((state: ListStoreState) => {
          if (!state.currentWord || !state.currentList) return state;

          const logEntry: AnswerLogEntry = {
            word: state.currentWord,
            userAnswer,
            correctAnswer: state.currentWord["2"],
            isCorrect: false,
            timestamp: new Date()
          };

          // Remove current word from its position and add it to the end for later review
          const currentWordCopy = { ...state.currentWord };
          const newData = state.currentList.data.filter(word =>
            !(word["1"] === state.currentWord!["1"] && word["2"] === state.currentWord!["2"])
          );
          // Add the wrong word to the end so it gets asked again later
          newData.push(currentWordCopy);

          return {
            ...state,
            currentList: {
              ...state.currentList,
              data: newData
            },
            score: { ...state.score, wrong: state.score.wrong + 1 },
            lastAnswer: {
              isCorrect: false,
              userAnswer,
              correctAnswer: state.currentWord["2"]
            },
            answerLog: [...state.answerLog, logEntry],
            incorrectAnswerLog: [...state.incorrectAnswerLog, logEntry]
          };
        });
      },
      resetScore: () => {
        set((state: ListStoreState) => ({
          ...state,
          score: { correct: 0, wrong: 0 },
          lastAnswer: null
        }));
      },
      clearLog: () => {
        set((state: ListStoreState) => ({
          ...state,
          answerLog: [],
          incorrectAnswerLog: []
        }));
      },
      getCorrectWords: () => {
        const state = get();
        return state.answerLog.filter(entry => entry.isCorrect);
      },
      getWrongWords: () => {
        const state = get();
        return state.answerLog.filter(entry => !entry.isCorrect);
      },
    });
  });

// Context for the store
export const ListStoreContext = createContext<StoreApi<ListStoreState> | null>(null);

// Hook to use the store
export function useListStore() {
  const store = useContext(ListStoreContext);
  if (!store) throw new Error('useListStore must be used within a ListStoreProvider');
  return useStore(store);
}