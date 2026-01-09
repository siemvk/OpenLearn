"use client";

import { useEffect } from "react";
import { useImpersonation } from "@/hooks/useImpersonation";
import ImpersonationBanner from "./ImpersonationBanner";

export default function ImpersonationCheck() {
    const { isImpersonating, adminName, impersonatedUserName } = useImpersonation();

    useEffect(() => {
        // When impersonation is active, add padding to body to prevent content from being hidden
        if (isImpersonating) {
            document.body.classList.add('has-impersonation-banner');
        } else {
            document.body.classList.remove('has-impersonation-banner');
        }

        // Clean up when component unmounts
        return () => {
            document.body.classList.remove('has-impersonation-banner');
        };
    }, [isImpersonating]);

    // Only render the banner if we have impersonation data
    if (!isImpersonating) {
        return null;
    }

    // If we have impersonation data, show the banner
    return (
        <ImpersonationBanner
            adminName={adminName}
            impersonatedUserName={impersonatedUserName}
        />
    );
}
