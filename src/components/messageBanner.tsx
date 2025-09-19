"use client"

import React, { useCallback, useLayoutEffect, useRef } from "react";

import { useSystemMessage, useSystemColor, useSystemKey } from "@/store/sysmsg/SysMsgProvider";
import { X } from "lucide-react";


export function MessageBanner() {
  const text = useSystemMessage();
  const color = useSystemColor() || '#2563eb';
  const sysKey = useSystemKey();
  const barRef = useRef<HTMLDivElement | null>(null);

  const handleDismiss = useCallback(() => {
    try {
      const key = sysKey || encodeURIComponent(`${text}|${color}`);
      document.cookie = `polarlearn.sysmsg_dismissed=${key}; path=/; max-age=${60 * 60 * 24 * 30}`;
    } catch { }
    // Hide instantly without reload
    const nav = document.getElementById('navbar') as HTMLElement | null;
    if (nav) nav.style.top = '0px';
    const root = document.documentElement;
    root.style.setProperty('--sys-banner-height', `0px`);
    const el = barRef.current;
    if (el) el.style.display = 'none';
  }, [text, color, sysKey]);

  useLayoutEffect(() => {
    const nav = document.getElementById('navbar') as HTMLElement | null;
    // If cookie says dismissed for this message+color, hide immediately (client-side guard)
    try {
      if (text) {
        const raw = `${text}|${color}`;
        const cookiePair = document.cookie.split('; ').find((c) => c.startsWith('polarlearn.sysmsg_dismissed='));
        if (cookiePair) {
          const val = cookiePair.split('=')[1];
          const dismissed = (() => { try { return decodeURIComponent(val); } catch { return val; } })();
          if (dismissed === raw) {
            if (nav) nav.style.top = '0px';
            if (typeof document !== 'undefined') {
              document.documentElement.style.setProperty('--sys-banner-height', `0px`);
            }
            const el = barRef.current;
            if (el) el.style.display = 'none';
            return; // skip measuring listeners
          }
        }
      }
    } catch { }
    const update = () => {
      const h = barRef.current?.offsetHeight || 0;
      // Set CSS var for other components (spacer) and move navbar
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--sys-banner-height', `${text ? h : 0}px`);
      }
      if (nav) nav.style.top = text ? `${h}px` : '0px';
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--sys-banner-height', `0px`);
      }
      if (nav) nav.style.top = '0px';
    };
  }, [text]);
  if (!text) return null;

  return (
    <div ref={barRef} className="fixed top-0 left-0 right-0 z-[60]">
      <div className="w-full shadow-md" style={{ background: color }}>
        <div className="max-w-6xl mx-auto flex items-center justify-center p-3 relative">
          <p className="font-medium text-white pointer-events-none select-none">{text}</p>
          <button
            type="button"
            aria-label="Banner sluiten"
            onClick={handleDismiss}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-white/80 hover:text-white hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <X />
          </button>
        </div>
      </div>
    </div>
  );
}