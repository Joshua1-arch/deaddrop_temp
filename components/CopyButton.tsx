"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: number;
}

export default function CopyButton({ text, className = "", size = 14 }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering parent click handlers
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={`p-1.5 rounded bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary border border-white/5 hover:border-white/10 transition-all active:scale-90 cursor-pointer ${className}`}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={size} className="text-accent-primary" />
      ) : (
        <Copy size={size} />
      )}
    </button>
  );
}
