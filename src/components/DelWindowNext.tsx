"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    next?: any;
  }
}

export default function DelWindowNext() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      delete window.next;
    }
  }, [])
  return null
}