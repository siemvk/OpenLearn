import { createStore } from 'zustand/vanilla'

export interface UserData {
  id: string;
  name: string;
  email: string;
  image: string;
  isAdmin: boolean;
  banned: boolean;
  forumBanned: boolean;
  forumBannedExpiry: string | null;
  impersonation?: {
    isImpersonating: boolean;
    adminName: string;
    impersonatedUserName: string;
  } | null;
}

// Store factory for SSR hydration
export const createUserDataStore = (initData?: Partial<UserData>) =>
  createStore<UserData>(() => ({
    id: initData?.id || '',
    name: initData?.name || '',
    email: initData?.email || '',
    image: initData?.image || '',
    isAdmin: initData?.isAdmin || false,
    banned: initData?.banned || false,
    forumBanned: initData?.forumBanned || false,
    forumBannedExpiry: initData?.forumBannedExpiry || null,
    impersonation: initData?.impersonation || null,
  }));

