import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-background-primary border-t border-white/5 py-12 px-4 md:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-accent-primary" />
            <span className="font-bold text-white tracking-tight">
              Dead<span className="text-accent-primary">Drop</span>
            </span>
          </div>
          <p className="text-xs text-text-secondary max-w-sm">
            Decentralized, time-locked document publishing. Encrypted client-side, stored on Walrus, anchored on Sui.
          </p>
          <p className="text-[10px] text-text-muted">
            &copy; {new Date().getFullYear()} DeadDrop Protocol. Open source. Trustless. Permanent.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-12 gap-y-6">
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Navigate</h4>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              <li>
                <Link href="/publish" className="hover:text-accent-primary transition-colors">
                  Publish Document
                </Link>
              </li>
              <li>
                <Link href="/verify/locked-demo" className="hover:text-accent-primary transition-colors">
                  Verify Document
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Protocol</h4>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              <li>
                <a href="https://walrus.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary transition-colors">
                  Walrus Storage
                </a>
              </li>
              <li>
                <a href="https://sui.io" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary transition-colors">
                  Sui Network
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Source</h4>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              <li>
                <a href="#" className="flex items-center gap-1.5 hover:text-accent-primary transition-colors">
                  <svg
                    className="w-3.5 h-3.5 text-current"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                  <span>GitHub Repository</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-white/5 mt-8 pt-6 flex justify-center text-[10px] text-text-muted font-mono">
        <span>
          Powered by{" "}
          <a href="https://tatum.io" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary transition-colors">Tatum</a>
          {" · "}
          <a href="https://walrus.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary transition-colors">Walrus</a>
          {" · "}
          <a href="https://sui.io" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary transition-colors">Sui</a>
        </span>
      </div>
    </footer>
  );
}
