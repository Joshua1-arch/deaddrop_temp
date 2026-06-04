"use client";

import React, { useState, useEffect } from "react";
import { ConnectButton } from "@mysten/dapp-kit";
import { useWallet } from "./WalletProvider";
import { LogOut, ChevronDown, Copy, Check } from "lucide-react";

export default function WalletButton() {
  const { isConnected, address, disconnect } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  // Detect mock mode via URL parameters
  const isMockMode = typeof window !== "undefined" && window.location.search.includes("mockWallet=true");

  if (isMockMode && isConnected) {
    const handleCopy = () => {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary transition-all hover:bg-accent-primary/20 active:scale-98 flex items-center gap-2 cursor-pointer shadow-glow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
          <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`} />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-[#0F0F15] border border-white/5 rounded-xl p-1.5 shadow-2xl z-50 animate-fadeIn">
            <button
              onClick={handleCopy}
              className="w-full px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-2">
                {copied ? <Check size={12} className="text-accent-primary" /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy Address"}
              </span>
            </button>
            <div className="h-px bg-white/5 my-1" />
            <button
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}
              className="w-full px-3 py-2 text-xs text-danger hover:bg-danger/10 rounded-lg flex items-center gap-2 transition-all"
            >
              <LogOut size={12} />
              <span>Disconnect</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <ConnectButton />
    </div>
  );
}
