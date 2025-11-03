"use client"

import { useEffect } from "react";

interface ChatwootProps {
  url?: string;
  token?: string;
  userIdentityValidation?: string;
}

export default function Chatwoot({
  url,
  token,
  userIdentityValidation
}: ChatwootProps) {
  useEffect(() => {
    if (!url || !token) {
      return;
    }

    // Load Chatwoot widget script
    const script = document.createElement("script");
    script.src = `${url}/packs/js/sdk.js`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Initialize Chatwoot after script loads
      if (typeof window !== "undefined" && (window as any).chatwootSDK) {
        (window as any).chatwootSDK.run({
          websiteToken: token,
          baseUrl: url,
          identityValidation: userIdentityValidation,
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [url, token, userIdentityValidation]);

  return null;
}