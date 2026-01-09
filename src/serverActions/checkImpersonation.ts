"use server";

import { getImpersonationData } from "@/utils/auth/getImpersonationData";

/**
 * Server action to check if the current user is impersonating another user
 * This is used by the client component to display the impersonation banner
 */
export async function checkImpersonationStatus() {
    return await getImpersonationData();
}
