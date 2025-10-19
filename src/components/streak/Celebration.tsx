"use client";
import React from 'react';
import Lottie from 'lottie-react';

import flameAnimation from '@/app/img/flame.json';

export default function Celebration({ className, loop = false }: { className?: string; loop?: boolean }) {
  return (
    <div className={className ?? 'absolute inset-0 flex items-center justify-center pointer-events-none z-30'}>
      <div style={{ width: 220, height: 220 }}>
        <Lottie animationData={flameAnimation as any} loop={loop} />
      </div>
    </div>
  );
}
