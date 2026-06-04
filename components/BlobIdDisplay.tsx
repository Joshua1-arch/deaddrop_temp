"use client";

import React, { useState } from "react";
import CopyButton from "./CopyButton";

interface BlobIdDisplayProps {
  id: string;
  label?: string;
  truncateLength?: number;
}

export default function BlobIdDisplay({
  id,
  label,
  truncateLength = 8,
}: BlobIdDisplayProps) {
  const [isHovered, setIsHovered] = useState(false);

  const truncated =
    id.length > truncateLength * 2
      ? `${id.slice(0, truncateLength)}...${id.slice(-truncateLength)}`
      : id;

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-text-secondary text-sm font-medium">{label}:</span>}
      
      <div
        className="relative flex items-center gap-1.5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="font-mono text-sm text-accent-secondary bg-background-secondary border border-white/5 rounded px-2 py-0.5 select-all">
          {truncated}
        </span>

        {isHovered && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs md:max-w-md bg-background-secondary border border-white/10 rounded-md shadow-2xl p-2.5 z-50 text-xs font-mono text-text-primary break-all animate-fadeIn">
            {id}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-background-secondary"></div>
          </div>
        )}
      </div>

      <CopyButton text={id} size={12} className="opacity-80 hover:opacity-100" />
    </div>
  );
}
