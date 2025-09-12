"use client";

import { useEffect } from "react";

export default function DelWindowNext() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      delete window.next;
    }
  }, [])
  return null
}