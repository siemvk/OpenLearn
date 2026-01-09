"use client";

import { useState, useEffect, memo } from "react";

// Completely isolated timer component
const Timer = memo(() => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format the time as MM:SS
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="text-white font-mono bg-neutral-700 px-3 py-1 rounded-md">
      {formatTime(seconds)}
    </div>
  );
});
Timer.displayName = "Timer";

export default Timer;
