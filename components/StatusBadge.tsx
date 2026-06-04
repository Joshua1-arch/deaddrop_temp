import React from "react";
import { Lock, Unlock, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: "LOCKED" | "UNLOCKED" | "PENDING";
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  switch (status) {
    case "LOCKED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FF444420] text-[#FF4444] border border-[#FF444430] ${className}`}
        >
          <Lock size={12} className="shrink-0" />
          LOCKED
        </span>
      );
    case "UNLOCKED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#00D4B420] text-[#00D4B4] border border-[#00D4B430] ${className}`}
        >
          <Unlock size={12} className="shrink-0" />
          UNLOCKED
        </span>
      );
    case "PENDING":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFB80020] text-[#FFB800] border border-[#FFB80030] ${className}`}
        >
          <Clock size={12} className="shrink-0" />
          PENDING
        </span>
      );
    default:
      return null;
  }
}
