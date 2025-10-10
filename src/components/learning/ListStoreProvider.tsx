"use client";
import React, { useRef } from 'react';
import { createListStore, ListStoreContext, type List } from './listStore';

export function ListStoreProvider({
  children,
  initialData
}: {
  children: React.ReactNode;
  initialData?: { list?: List; method?: string; flipQuestionLang?: boolean; learnListQueue?: { word: string; mode: string; answer: string, mcOpts?: string[] }[] }
}) {
  // Only create the store once per provider instance
  const storeRef = useRef(createListStore(initialData));

  return (
    <ListStoreContext.Provider value={storeRef.current}>
      {children}
    </ListStoreContext.Provider>
  );
}