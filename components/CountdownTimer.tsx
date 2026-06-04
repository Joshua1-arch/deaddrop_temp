"use client";

import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
  unlockDate: string | Date;
  onUnlock?: () => void;
}

export default function CountdownTimer({ unlockDate, onUnlock }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0
  });

  useEffect(() => {
    const targetDate = typeof unlockDate === "string" ? new Date(unlockDate) : unlockDate;

    function calculateTimeLeft() {
      const difference = targetDate.getTime() - Date.now();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
        if (onUnlock) onUnlock();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        totalMs: difference
      });
    }

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [unlockDate, onUnlock]);

  const { days, hours, minutes, seconds, totalMs } = timeLeft;

  // Determine color based on time left
  let textColorClass = "text-accent-primary"; // Default: > 1 day (teal)
  if (totalMs <= 0) {
    textColorClass = "text-accent-primary";
  } else if (totalMs < 1000 * 60 * 60) {
    textColorClass = "text-danger"; // < 1 hour (red)
  } else if (totalMs < 1000 * 60 * 60 * 24) {
    textColorClass = "text-warning"; // < 1 day (amber)
  }

  // Format utility
  const formatNum = (num: number) => num.toString().padStart(2, "0");

  const timeSegments = [
    { label: "DAYS", value: formatNum(days) },
    { label: "HOURS", value: formatNum(hours) },
    { label: "MINUTES", value: formatNum(minutes) },
    { label: "SECONDS", value: formatNum(seconds) }
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 md:gap-4 select-none">
        {timeSegments.map((seg, idx) => (
          <React.Fragment key={seg.label}>
            <div className="flex flex-col items-center">
              <div
                className={`font-mono text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight ${textColorClass} bg-background-secondary border border-white/5 rounded-xl px-3 py-2 md:px-4 md:py-3 w-16 md:w-24 text-center shadow-inner`}
              >
                {seg.value}
              </div>
              <span className="text-[10px] md:text-xs font-mono text-text-muted mt-2 tracking-wider">
                {seg.label}
              </span>
            </div>
            {idx < timeSegments.length - 1 && (
              <span className={`text-xl md:text-4xl font-mono ${textColorClass} -mt-4`}>
                :
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
