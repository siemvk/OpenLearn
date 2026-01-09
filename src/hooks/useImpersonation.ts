"use client";

import { useUserDataStore } from "@/store/user/UserDataProvider";
import { useStore } from "zustand";

/**
 * Custom hook to access impersonation data from the UserData store
 * This replaces the need for server actions and provides SSR'd impersonation state
 */
export function useImpersonation() {
  const store = useUserDataStore();
  const impersonation = useStore(store, (state) => state.impersonation);

  return {
    isImpersonating: impersonation?.isImpersonating || false,
    adminName: impersonation?.adminName || '',
    impersonatedUserName: impersonation?.impersonatedUserName || '',
    impersonationData: impersonation,
  };
}
