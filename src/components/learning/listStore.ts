import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useContext, createContext } from 'react';
import type { StoreApi } from 'zustand/vanilla';

export interface ListItem {
  "1": string; // source term (e.g., "sum")
  "2": string; // target term (e.g., "zijn")
  id?: number; // optional id from database
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
  currentMethod: string | null; // Current learning method (learnlist, hints, test, etc.)
  originalWordCount: number; // Total words at start (for progress calculation)
  flipQuestionLang: boolean; // Whether question/answer languages are flipped
  score: { correct: number; wrong: number };
  lastAnswer: { isCorrect: boolean; userAnswer: string; correctAnswer: string } | null;
  answerLog: AnswerLogEntry[];
  shuffleList: () => void;
  setList: (list: List) => void;
  setMethod: (method: string) => void;
  setFlipQuestionLang: (flip: boolean) => void;
  setRandomCurrentWord: () => void;
  clearCurrentWord: () => void;
  checkAnswer: (userAnswer: string) => boolean;
  answerCorrect: () => void;
  answerWrong: (userAnswer: string) => void;
  resetScore: () => void;
  clearLog: () => void;
  getCorrectWords: () => AnswerLogEntry[];
  getWrongWords: () => AnswerLogEntry[];
}

// Store factory for SSR hydration
export const createListStore = (initData?: { list?: List; method?: string; flipQuestionLang?: boolean, learnListQueue?: { word: string, mode: string } }) =>
  createStore<ListStoreState>((set, get) => ({
    currentList: initData?.list || null,
    currentWord: initData?.list?.data?.[0] || null, // Set first word immediately for SSR
    currentMethod: initData?.method || null,
    originalWordCount: initData?.list?.data?.length || 0, // Track original count for progress
    flipQuestionLang: initData?.flipQuestionLang || false,
    score: { correct: 0, wrong: 0 },
    lastAnswer: null,
    learnListQueue: {},
    answerLog: [],
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
      set({ currentList: list, currentWord: null, score: { correct: 0, wrong: 0 }, lastAnswer: null, answerLog: [] });
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
          answerLog: [...state.answerLog, logEntry]
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
        answerLog: []
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
  }));

// Context for the store
export const ListStoreContext = createContext<StoreApi<ListStoreState> | null>(null);

// Hook to use the store
export function useListStore() {
  const store = useContext(ListStoreContext);
  if (!store) throw new Error('useListStore must be used within a ListStoreProvider');
  return useStore(store);
}