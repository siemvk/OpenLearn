import React, { createContext, useContext, useRef } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { SystemMessage } from './systemMessage';
import { createSysMsgStore } from './systemMessage';

// React context for the store
const SysMsgStoreContext = createContext<StoreApi<SystemMessage> | null>(null);

export function SysMsgProvider({ children, sysMsgData }: { children: React.ReactNode; sysMsgData: Partial<SystemMessage> }) {
  // Only create the store once per provider instance
  const storeRef = useRef<StoreApi<SystemMessage>>(createSysMsgStore(sysMsgData));
  return (
    <SysMsgStoreContext.Provider value={storeRef.current}>
      {children}
    </SysMsgStoreContext.Provider>
  );
}

// Hook to use the store in components
export function useSysMsgStore() {
  const store = useContext(SysMsgStoreContext);
  if (!store) throw new Error('useSysMsgStore must be used within a SysMsgProvider');
  return store;
}

// Convenience hooks for system message data
export function useSystemMessage() {
  const store = useSysMsgStore();
  return useStore(store, (state) => state.message);
}

export function useSystemColor() {
  const store = useSysMsgStore();
  return useStore(store, (state) => state.color);
}

export function useSystemKey() {
  const store = useSysMsgStore();
  return useStore(store, (state) => state.key);
}
