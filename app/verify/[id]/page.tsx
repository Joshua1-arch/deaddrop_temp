"use client";

import React, { useState, useEffect } from "react";
import { getPublication } from "@/lib/sui";
import { fetchFromWalrus } from "@/lib/walrus";
import { decryptDocument } from "@/lib/crypto";
import { Publication } from "@/types/publication";
import StatusBadge from "@/components/StatusBadge";
import CountdownTimer from "@/components/CountdownTimer";
import CopyButton from "@/components/CopyButton";
import {
  Lock,
  Unlock,
  FileCheck2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Loader2,
  HelpCircle,
  Download,
  Calendar,
  User,
  Database,
  Link2,
} from "lucide-react";
import Link from "next/link";

interface VerifyPageProps {
  params: {
    id: string;
  };
}

function detectFileType(bytes: Uint8Array): 'pdf' | 'image' | 'text' {
  // Check PDF signature: %PDF (0x25 0x50 0x44 0x46)
  if (bytes.length >= 4 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46) {
    return 'pdf';
  }

  // Check PNG signature: 0x89 0x50 0x4E 0x47
  if (bytes.length >= 4 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4E &&
      bytes[3] === 0x47) {
    return 'image';
  }

  // Check JPEG signature: 0xFF 0xD8 0xFF
  if (bytes.length >= 3 &&
      bytes[0] === 0xFF &&
      bytes[1] === 0xD8 &&
      bytes[2] === 0xFF) {
    return 'image';
  }

  // Check GIF signature: GIF8 (0x47 0x49 0x46 0x38)
  if (bytes.length >= 4 &&
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38) {
    return 'image';
  }

  return 'text';
}

export default function VerifyPage({ params }: VerifyPageProps) {
  const documentId = params.id;
  const [loading, setLoading] = useState(true);
  const [publication, setPublication] = useState<Publication | null>(null);
  const [isAccessible, setIsAccessible] = useState(false);

  // Decryption Flow States
  const [decryptionKey, setDecryptionKey] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedBytes, setDecryptedBytes] = useState<Uint8Array | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<'pdf' | 'image' | 'text' | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [decryptionError, setDecryptionError] = useState("");

  // Load publication details from Sui blockchain
  useEffect(() => {
    async function loadPublication() {
      setLoading(true);
      try {
        const pub = await getPublication(documentId);
        if (pub) {
          setPublication(pub);
          
          // Determine if document is accessible based on current time vs unlockAt timestamp
          const now = Date.now();
          const unlockTime = new Date(pub.unlockAt).getTime();
          const accessible = 
            pub.unlockAt === "0" || 
            (pub.unlockAt as any) === 0 || 
            unlockTime === 0 || 
            now >= unlockTime;
          setIsAccessible(accessible);

          // Auto-populate decryption key if stored on-chain
          if (pub.decryptionKey) {
            setDecryptionKey(pub.decryptionKey);
          }
        } else {
          setPublication(null);
        }
      } catch (err) {
        console.error("Error loading publication:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPublication();
  }, [documentId]);

  // Handle activeUrl updates
  useEffect(() => {
    let activeUrl = "";
    if (decryptedBytes) {
      const type = detectFileType(decryptedBytes);
      setDetectedType(type);

      if (type === 'pdf') {
        const blob = new Blob([decryptedBytes as any], { type: 'application/pdf' });
        activeUrl = URL.createObjectURL(blob);
        setObjectUrl(activeUrl);
        try {
          window.open(activeUrl, '_blank');
        } catch (e) {
          console.error("Popup blocked:", e);
        }
      } else if (type === 'image') {
        let mime = 'image/png';
        if (decryptedBytes[0] === 0xFF && decryptedBytes[1] === 0xD8) {
          mime = 'image/jpeg';
        } else if (decryptedBytes[0] === 0x47 && decryptedBytes[1] === 0x49) {
          mime = 'image/gif';
        }
        const blob = new Blob([decryptedBytes as any], { type: mime });
        activeUrl = URL.createObjectURL(blob);
        setObjectUrl(activeUrl);
      } else {
        const decoder = new TextDecoder();
        setDecryptedText(decoder.decode(decryptedBytes));
      }
    }
    
    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [decryptedBytes]);

  // Handle timer expire
  const handleTimerUnlock = () => {
    setIsAccessible(true);
  };

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decryptionKey.trim()) {
      setDecryptionError("Please enter a decryption key.");
      return;
    }
    setDecryptionError("");
    setIsDecrypting(true);

    try {
      if (!publication) return;

      // 1. Download encrypted bytes from Walrus
      const encryptedBytes = await fetchFromWalrus(publication.blobId);

      // 2. Perform client-side decryption using Web Crypto API
      const decrypted = await decryptDocument(encryptedBytes, decryptionKey.trim());
      
      setDecryptedBytes(decrypted);
      setDecryptionError("");
    } catch (err: any) {
      console.error(err);
      setDecryptionError(err.message || "Decryption failed. Please verify your key.");
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDownloadDecrypted = () => {
    if (!decryptedBytes || !publication) return;
    try {
      let ext = 'txt';
      let mime = 'text/plain';
      if (detectedType === 'pdf') {
        ext = 'pdf';
        mime = 'application/pdf';
      } else if (detectedType === 'image') {
        ext = 'png';
        mime = 'image/png';
        if (decryptedBytes[0] === 0xFF && decryptedBytes[1] === 0xD8) {
          ext = 'jpg';
          mime = 'image/jpeg';
        } else if (decryptedBytes[0] === 0x47 && decryptedBytes[1] === 0x49) {
          ext = 'gif';
          mime = 'image/gif';
        }
      }
      const element = document.createElement("a");
      const fileBlob = new Blob([decryptedBytes as any], { type: mime });
      element.href = URL.createObjectURL(fileBlob);
      element.download = `decrypted_${publication.title.replace(/\.[^/.]+$/, "")}.${ext}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  // State 1: Loading
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 size={36} className="text-accent-primary animate-spin" />
        <p className="text-sm font-mono text-text-secondary">Resolving publication from Sui blockchain...</p>
      </div>
    );
  }

  // State 2: Publication Not Found
  if (!publication) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="card-custom max-w-md w-full text-center p-8 space-y-6 flex flex-col items-center">
          <div className="p-4 bg-white/5 border border-white/5 rounded-full text-danger">
            <HelpCircle size={36} className="text-danger animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-text-primary">Document Not Found</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              The publication ID <code className="bg-background-primary px-1.5 py-0.5 rounded text-accent-secondary font-mono text-xs break-all">{documentId}</code> does not exist on-chain or may not have completed propagation yet.
            </p>
          </div>
          <Link href="/" className="btn-primary w-full py-2.5 text-xs font-semibold">
            Return to Landing
          </Link>
        </div>
      </div>
    );
  }

  // State 3: Publication Found
  return (
    <div className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8 space-y-8 flex flex-col justify-center">
      {/* Locked / Unlocked Container Header */}
      <div className="bg-background-card border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl relative space-y-8">
        
        {/* Status Illustration */}
        <div className="flex flex-col items-center text-center space-y-4">
          {!isAccessible ? (
            <>
              <div className="p-4 bg-[#FF444410] border border-[#FF444420] rounded-full text-[#FF4444] shadow-[0_0_15px_rgba(255,68,68,0.1)]">
                <Lock size={32} className="stroke-[2.5]" />
              </div>
              <StatusBadge status="LOCKED" />
              <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">
                {publication.title}
              </h1>
            </>
          ) : (
            <>
              <div className="p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-full text-accent-primary shadow-[0_0_15px_rgba(0,212,180,0.15)]">
                <Unlock size={32} className="stroke-[2.5]" />
              </div>
              <StatusBadge status="UNLOCKED" />
              <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">
                {publication.title}
              </h1>
              <p className="text-xs text-accent-primary font-mono uppercase tracking-widest">
                This document is now publicly accessible
              </p>
            </>
          )}
        </div>

        {/* Live Countdown for Locked Items */}
        {!isAccessible && (
          <div className="space-y-4 py-4 border-y border-white/5">
            <h3 className="text-center text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
              Time Remaining Until Decryption Unlock
            </h3>
            <CountdownTimer unlockDate={publication.unlockAt} onUnlock={handleTimerUnlock} />
          </div>
        )}

        {/* Metadata Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary border-b border-white/5 pb-2">
            Verification Records
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Publisher Address */}
            <div className="bg-background-secondary border border-white/5 rounded-lg p-3 space-y-1.5">
              <span className="text-text-muted text-[10px] uppercase tracking-wider flex items-center gap-1">
                <User size={12} />
                Publisher Address
              </span>
              <div className="flex items-center justify-between gap-1 text-text-primary">
                <span className="truncate" title={publication.publisher}>
                  {truncateAddress(publication.publisher)}
                </span>
                <CopyButton text={publication.publisher} size={10} />
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-background-secondary border border-white/5 rounded-lg p-3 space-y-1.5">
              <span className="text-text-muted text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} />
                Immutable Timestamps
              </span>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Sealed:</span>
                  <span className="text-text-primary">
                    {new Date(publication.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Unlocks:</span>
                  <span className="text-text-primary">
                    {new Date(publication.unlockAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Walrus Blob ID */}
            <div className="bg-background-secondary border border-white/5 rounded-lg p-3 space-y-1.5 md:col-span-2">
              <span className="text-text-muted text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Database size={12} />
                Walrus Decentralized Blob ID
              </span>
              <div className="flex items-center justify-between gap-2 text-text-primary">
                <span className="text-accent-primary truncate select-all">{publication.blobId}</span>
                <CopyButton text={publication.blobId} size={10} />
              </div>
            </div>

            {/* Sui Object ID */}
            <div className="bg-background-secondary border border-white/5 rounded-lg p-3 space-y-1.5 md:col-span-2">
              <span className="text-text-muted text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Link2 size={12} />
                Sui Smart Contract Object ID
              </span>
              <div className="flex items-center justify-between gap-2 text-text-primary">
                <span className="text-accent-secondary truncate select-all">{publication.id}</span>
                <CopyButton text={publication.id} size={10} />
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        {!isAccessible ? (
          <div className="flex items-start gap-2.5 p-4 bg-danger/5 border border-danger/10 rounded-lg text-xs leading-relaxed text-text-secondary">
            <ShieldAlert size={16} className="text-danger shrink-0 mt-0.5" />
            <div>
              <strong className="block text-text-primary font-semibold mb-1">
                Move Smart Contract Enforced Time-Lock
              </strong>
              This document is sealed with a cryptographic time-lock. The release parameters are stored inside the Sui blockchain state and enforced at the contract layer. Early decryption is impossible.
            </div>
          </div>
        ) : (
          /* Unlocked Decryption Form */
          <div className="space-y-4 border-t border-white/5 pt-6">
            {!decryptedBytes ? (
              <form onSubmit={handleDecrypt} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
                    Enter Decryption Key to Read Document
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      placeholder="e.g. dd-key-..."
                      value={decryptionKey}
                      onChange={(e) => setDecryptionKey(e.target.value)}
                      className="flex-1 bg-background-secondary border border-white/10 rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isDecrypting}
                      className="btn-primary py-2.5 px-6 text-sm font-semibold shrink-0"
                    >
                      {isDecrypting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Decrypting...</span>
                        </>
                      ) : (
                        <span>Decrypt & View</span>
                      )}
                    </button>
                  </div>
                </div>

                {decryptionError && (
                  <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs font-semibold font-mono">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{decryptionError}</span>
                  </div>
                )}
                
                {/* Note for testing demo key */}
                {documentId === "unlocked-demo" && (
                  <div className="p-3 bg-accent-primary/5 border border-accent-primary/10 rounded-lg text-xs leading-relaxed text-text-secondary font-mono">
                    <span className="text-accent-primary font-semibold">Demo Decryption Key:</span>{" "}
                    <code>dd-key-4f2a-b9c8-0d1e-2f3a-4b5c-6d7e</code> (Click copy button in dashboard or input directly to decrypt).
                  </div>
                )}
              </form>
            ) : (
              /* Decrypted Content Box */
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-accent-primary flex items-center gap-1.5">
                    <FileCheck2 size={14} />
                    Decrypted Payload Output
                  </span>
                  
                  <button
                    onClick={handleDownloadDecrypted}
                    className="btn-muted py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Download size={12} />
                    Download File
                  </button>
                </div>

                {detectedType === 'pdf' && objectUrl && (
                  <div className="bg-background-primary border border-white/10 rounded-xl p-5 text-center space-y-4">
                    <p className="text-sm text-text-secondary">
                      PDF Document Decrypted. It has been opened in a new tab.
                    </p>
                    <a
                      href={objectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <span>Open PDF in New Tab</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                {detectedType === 'image' && objectUrl && (
                  <div className="bg-background-primary border border-white/10 rounded-xl p-5 flex justify-center">
                    <img src={objectUrl} alt="Decrypted Payload" className="max-w-full max-h-[500px] object-contain rounded-lg border border-white/5 shadow-lg" />
                  </div>
                )}

                {detectedType === 'text' && decryptedText !== null && (
                  <div className="bg-background-primary border border-white/10 rounded-xl p-5 font-mono text-xs md:text-sm text-text-primary leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto custom-scrollbar select-all">
                    {decryptedText}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* View on SuiScan Footer Action */}
        <div className="pt-4 flex justify-center border-t border-white/5">
          <a
            href={`https://suiscan.xyz/testnet/object/${publication.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-muted w-full md:w-auto py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <span>View on SuiScan Ledger</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
