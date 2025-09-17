import { useState, useCallback } from 'react';

// Types for learning state management
type LearnMethod = "gedachten" | "multikeuze" | "hints" | "toets";

interface WordStats {
  attempts: number;
  correctCount: number;
  lastMethod: LearnMethod;
  methodsUsed: Set<string>;
}

interface LearningState {
  // UI State
  userInput: string;
  randomNumber: number;
  typoSubmitted: string | null;

  // Overlay States
  toonAntwoord: boolean;
  showCorrect: boolean;
  showGedachtenOverlay: boolean;
  isAnswering: boolean;
  toonTypo: boolean;

  // Learning Progress
  listCompleted: boolean;
  streakUpdateTriggered: boolean;
  currentLerenMethod: LearnMethod;

  // Stats
  streakInfo: {
    currentStreak: number;
    isNewStreak: boolean;
  };
  lerenWordStats: Map<string, WordStats>;
  lerenCompleted: Set<string>;
}

export const useLearningState = (initialRandomNumber: number = 1) => {
  const [state, setState] = useState<LearningState>(() => ({
    // UI State
    userInput: "",
    randomNumber: initialRandomNumber,
    typoSubmitted: null,

    // Overlay States
    toonAntwoord: false,
    showCorrect: false,
    showGedachtenOverlay: false,
    isAnswering: false,
    toonTypo: false,

    // Learning Progress
    listCompleted: false,
    streakUpdateTriggered: false,
    currentLerenMethod: "multikeuze" as LearnMethod,

    // Stats
    streakInfo: {
      currentStreak: 0,
      isNewStreak: false,
    },
    lerenWordStats: new Map<string, WordStats>(),
    lerenCompleted: new Set<string>(),
  }));

  // Optimized updater function
  const updateState = useCallback((updates: Partial<LearningState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper functions for common state updates
  const setUserInput = useCallback((value: string) => {
    updateState({ userInput: value });
  }, [updateState]);

  const setToonAntwoord = useCallback((value: boolean) => {
    updateState({ toonAntwoord: value });
  }, [updateState]);

  const setShowCorrect = useCallback((value: boolean) => {
    updateState({ showCorrect: value });
  }, [updateState]);

  const setShowGedachtenOverlay = useCallback((value: boolean) => {
    updateState({ showGedachtenOverlay: value });
  }, [updateState]);

  const setIsAnswering = useCallback((value: boolean) => {
    updateState({ isAnswering: value });
  }, [updateState]);

  const setToonTypo = useCallback((value: boolean) => {
    updateState({ toonTypo: value });
  }, [updateState]);

  const setListCompleted = useCallback((value: boolean) => {
    updateState({ listCompleted: value });
  }, [updateState]);

  const setStreakUpdateTriggered = useCallback((value: boolean) => {
    updateState({ streakUpdateTriggered: value });
  }, [updateState]);

  const setCurrentLerenMethod = useCallback((value: LearnMethod) => {
    updateState({ currentLerenMethod: value });
  }, [updateState]);

  const setStreakInfo = useCallback((value: typeof state.streakInfo) => {
    updateState({ streakInfo: value });
  }, [updateState]);

  const setRandomNumber = useCallback((value: number) => {
    updateState({ randomNumber: value });
  }, [updateState]);

  const setTypoSubmitted = useCallback((value: string | null) => {
    updateState({ typoSubmitted: value });
  }, [updateState]);

  const setLerenWordStats = useCallback((value: Map<string, WordStats> | ((prev: Map<string, WordStats>) => Map<string, WordStats>)) => {
    if (typeof value === 'function') {
      updateState({ lerenWordStats: value(state.lerenWordStats) });
    } else {
      updateState({ lerenWordStats: value });
    }
  }, [updateState, state.lerenWordStats]);

  const setLerenCompleted = useCallback((value: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (typeof value === 'function') {
      updateState({ lerenCompleted: value(state.lerenCompleted) });
    } else {
      updateState({ lerenCompleted: value });
    }
  }, [updateState, state.lerenCompleted]);

  // Computed values
  const locked = state.toonAntwoord || state.showCorrect || state.showGedachtenOverlay || state.toonTypo;

  return {
    // State
    ...state,
    locked,

    // Setters
    updateState,
    setUserInput,
    setToonAntwoord,
    setShowCorrect,
    setShowGedachtenOverlay,
    setIsAnswering,
    setToonTypo,
    setListCompleted,
    setStreakUpdateTriggered,
    setCurrentLerenMethod,
    setStreakInfo,
    setRandomNumber,
    setTypoSubmitted,
    setLerenWordStats,
    setLerenCompleted,
  };
};

export type { LearnMethod, WordStats, LearningState };