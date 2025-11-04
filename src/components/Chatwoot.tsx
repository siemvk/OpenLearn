"use client"

import { useEffect } from "react";
import { useUserDataStore } from "@/store/user/UserDataProvider";

export default function Chatwoot({
  url,
  token,
  hmac,
}: {
  url?: string;
  token?: string;
  hmac?: string;
}) {
  const user = useUserDataStore().getState();
  useEffect(() => {
    if (!url || !token || !hmac) {
      return;
    }

    const element = document.createElement("script");
    element.src = `${url}/packs/js/sdk.js`;
    element.async = true;
    element.defer = true;
    element.onload = () => {
      (window as any).chatwootSDK.run({
        websiteToken: token,
        baseUrl: url,
      })
    }

    document.body.appendChild(element);

    window.addEventListener("chatwoot:ready", () => {
      (window as any).$chatwoot.setUser(user.email, {
        email: user.email,
        name: user.name,
        avatar_url: user.image,
        identifier_hash: hmac,
      })
    })
  });

  return null;
}
