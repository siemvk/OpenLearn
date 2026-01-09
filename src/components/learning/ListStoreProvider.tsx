"use client";
import React, { useRef } from 'react';
import { createListStore, ListStoreContext, type List, type AnswerLogEntry } from './listStore';

export function ListStoreProvider({
  children,
  initialData
}: {
  children: React.ReactNode;
  initialData?: {
    list?: List;
    method?: string;
    flipQuestionLang?: boolean;
    sessionId?: string;
    learnListQueue?: { word: string; mode: string; answer: string; mcOpts?: string[] }[];
    score?: { correct: number; wrong: number };
    answerLog?: AnswerLogEntry[];
    incorrectAnswerLog?: AnswerLogEntry[];
    originalWordCount?: number;
    originalQueueLength?: number;
  }
}) {
  // Only create the store once per provider instance
  const storeRef = useRef(createListStore(initialData));

  return (
    <ListStoreContext.Provider value={storeRef.current}>
      {children}
    </ListStoreContext.Provider>
  );
}