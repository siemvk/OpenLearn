import { createStore } from "zustand/vanilla";


export interface SystemMessage {
  message?: string;
  color?: string;
  key?: string;
}
// Store factory for SSR hydration
export const createSysMsgStore = (initData?: Partial<SystemMessage>) =>
  createStore<SystemMessage>(() => ({
    message: initData?.message || '',
    color: initData?.color || 'info',
    key: initData?.key || '',
  }));