"use client";
import React, { createContext, useContext, useRef } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { StreakStore, StreakData } from './StreakData';
import { createStreakStore } from './StreakData';

// React context for the store
const StreakStoreContext = createContext<StoreApi<StreakStore> | null>(null);

export function StreakProvider({ children, streakData }: { children: React.ReactNode; streakData: Partial<StreakData> }) {
  // Only create the store once per provider instance
  const storeRef = useRef<StoreApi<StreakStore>>(createStreakStore(streakData));
  return (
    <StreakStoreContext.Provider value={storeRef.current}>
      {children}
    </StreakStoreContext.Provider>
  );
}

// Hook to use the store in components
export function useStreakStore() {
  const store = useContext(StreakStoreContext);
  if (!store) throw new Error('useStreakStore must be used within a StreakProvider');
  return store;
}

// Convenience hooks for common streak data
export function useStreak() {
  const store = useStreakStore();
  return useStore(store, (state) => state.streak);
}

export function useFreezes() {
  const store = useStreakStore();
  return useStore(store, (state) => state.freezes);
}

export function useWeekActivity() {
  const store = useStreakStore();
  return useStore(store, (state) => state.weekActivity);
}

export function useIsActiveStreak() {
  const store = useStreakStore();
  return useStore(store, (state) => state.isActiveStreak());
}
