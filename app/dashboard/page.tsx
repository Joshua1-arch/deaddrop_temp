"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/components/WalletProvider";
import { getPublicationsByOwner, tryUnlock } from "@/lib/sui";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Publication } from "@/types/publication";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import {
  Wallet,
  Lock,
  Unlock,
  Layers,
  FileCheck2,
  FileClock,
  Plus,
  ExternalLink,
  Loader2,
  Share2,
  Check,
  Key,
  X,
} from "lucide-react";

export default function DashboardPage() {
  const { isConnected, address, connect } = useWallet();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [loading, setLoading] = useState(true);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  
  // Share Key modal states
  const [shareKeyPubId, setShareKeyPubId] = useState<string | null>(null);
  const [enteredKey, setEnteredKey] = useState("");
  const [copiedShareMessage, setCopiedShareMessage] = useState(false);

  const handleUnlockOnChain = async (pubId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUnlockingId(pubId);
    try {
      const isMockMode = typeof window !== "undefined" && window.location.search.includes("mockWallet=true");
      await tryUnlock(pubId, isMockMode ? () => Promise.resolve({ digest: "mock" }) : signAndExecuteTransaction);
      await loadPublications();
    } catch (err) {
      console.error("Failed to unlock publication on chain:", err);
    } finally {
      setUnlockingId(null);
    }
  };

  const loadPublications = async () => {
    if (!isConnected) return;
    setLoading(true);
    try {
      const data = await getPublicationsByOwner(address);
      setPublications(data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  // Loading skeleton helper component
  const TableSkeleton = () => (
    <div className="bg-background-card border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6 space-y-4 animate-pulse">
      <div className="h-6 w-1/4 bg-white/5 rounded mb-4"></div>
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
            <div className="h-4 w-1/4 bg-white/5 rounded"></div>
            <div className="h-4 w-1/12 bg-white/5 rounded hidden md:block"></div>
            <div className="h-4 w-1/12 bg-white/5 rounded"></div>
            <div className="h-4 w-1/6 bg-white/5 rounded hidden md:block"></div>
            <div className="h-4 w-1/6 bg-white/5 rounded hidden md:block"></div>
            <div className="h-8 w-32 bg-white/5 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Copy share link handler
  const handleCopyLink = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const shareUrl = `${window.location.origin}/verify/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const truncateBlobId = (id: string) => {
    return `${id.slice(0, 6)}...${id.slice(-6)}`;
  };

  // Stats computation
  const totalPubs = publications.length;
  const lockedPubs = publications.filter((p) => {
    const isLocked = new Date(p.unlockAt).getTime() > Date.now();
    return isLocked;
  }).length;
  const unlockedPubs = totalPubs - lockedPubs;

  // 1. Wallet Not Connected
  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="card-custom max-w-md w-full text-center p-8 space-y-6 flex flex-col items-center">
          <div className="p-4 bg-white/5 border border-white/5 rounded-full text-text-secondary">
            <Wallet size={36} className="text-text-secondary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-text-primary">Connect Wallet to View Dashboard</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Authenticate your Sui wallet to view and manage publications created by your address.
            </p>
          </div>
          <button
            onClick={connect}
            className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
          >
            Connect Sui Wallet
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">My Publications</h1>
          <p className="text-sm text-text-secondary">
            All documents published from your wallet: <span className="font-mono text-accent-secondary">{address.slice(0, 8)}...{address.slice(-8)}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadPublications}
            className="btn-secondary py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5"
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
              </svg>
            )}
            <span>Refresh</span>
          </button>
          
          <Link href="/publish" className="btn-primary py-2.5 px-4 text-xs font-semibold">
            <Plus size={16} />
            Publish Document
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Card */}
        <div className="bg-background-card border border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-secondary">Total Published</span>
            <p className="text-3xl font-bold text-text-primary font-mono">{totalPubs}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-text-secondary">
            <Layers size={22} />
          </div>
        </div>

        {/* Locked Card */}
        <div className="bg-background-card border border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-secondary">Currently Locked</span>
            <p className="text-3xl font-bold text-danger font-mono">{lockedPubs}</p>
          </div>
          <div className="p-3 bg-danger/10 rounded-lg text-danger">
            <FileClock size={22} />
          </div>
        </div>

        {/* Unlocked Card */}
        <div className="bg-background-card border border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-secondary">Unlocked</span>
            <p className="text-3xl font-bold text-success font-mono">{unlockedPubs}</p>
          </div>
          <div className="p-3 bg-success/10 rounded-lg text-success">
            <FileCheck2 size={22} />
          </div>
        </div>
      </div>

      {/* Table / Publications List */}
      {loading ? (
        <TableSkeleton />
      ) : publications.length === 0 ? (
        /* Empty State */
        <div className="bg-background-card border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-6">
          <div className="p-4 bg-white/5 rounded-full text-text-muted">
            <Lock size={44} className="stroke-[1.5]" />
          </div>
          <div className="space-y-2 max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-text-primary">No Publications Yet</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Seal your first confidential report or digital contract. Your records will be secured on the blockchain ledger.
            </p>
          </div>
          <Link href="/publish" className="btn-primary py-2.5 px-6 text-xs font-semibold">
            Publish your first document
          </Link>
        </div>
      ) : (
        /* Desktop Table View */
        <div className="bg-background-card border border-white/5 rounded-xl overflow-hidden shadow-2xl">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-background-secondary/50 text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                  <th className="py-4 px-5">Document Title</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Published Date</th>
                  <th className="py-4 px-5">Unlock Date</th>
                  <th className="py-4 px-5">Blob ID</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-xs md:text-sm">
                {publications.map((pub) => {
                  const isLocked = new Date(pub.unlockAt).getTime() > Date.now();
                  const status = isLocked ? "LOCKED" : "UNLOCKED";
                  
                  return (
                    <tr key={pub.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5 font-semibold text-text-primary max-w-xs truncate">
                        {pub.title}
                      </td>
                      <td className="py-4 px-5 text-text-secondary">
                        {pub.category}
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge status={status} />
                      </td>
                      <td className="py-4 px-5 text-text-secondary font-mono">
                        {new Date(pub.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5 text-text-secondary font-mono">
                        {new Date(pub.unlockAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5 text-accent-primary font-mono text-xs">
                        {truncateBlobId(pub.blobId)}
                      </td>
                      <td className="py-4 px-5 text-right space-x-2">
                        {pub.isLocked && !isLocked && (
                          <button
                            onClick={(e) => handleUnlockOnChain(pub.id, e)}
                            disabled={unlockingId === pub.id}
                            className="btn-primary p-2 py-1.5 text-xs inline-flex items-center gap-1 hover:text-accent-secondary bg-accent-secondary/15 border-accent-secondary/20 hover:bg-accent-secondary/25"
                          >
                            {unlockingId === pub.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Unlock size={12} />
                            )}
                            <span>Unlock On-Chain</span>
                          </button>
                        )}
                        {!isLocked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareKeyPubId(pub.id);
                              setEnteredKey("");
                              setCopiedShareMessage(false);
                            }}
                            className="btn-primary p-2 py-1.5 text-xs inline-flex items-center gap-1 hover:text-accent-secondary"
                          >
                            <Key size={12} />
                            <span>Share Key</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => handleCopyLink(pub.id, e)}
                          className="btn-muted p-2 py-1.5 text-xs inline-flex items-center gap-1 hover:text-accent-primary"
                        >
                          {copiedId === pub.id ? (
                            <>
                              <Check size={12} className="text-accent-primary" />
                              <span className="text-accent-primary font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Share2 size={12} />
                              <span>Share</span>
                            </>
                          )}
                        </button>
                        <Link
                          href={`/verify/${pub.id}`}
                          className="btn-primary py-1.5 px-3 text-xs inline-flex items-center gap-1"
                        >
                          <span>View</span>
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid View */}
          <div className="md:hidden divide-y divide-white/5">
            {publications.map((pub) => {
              const isLocked = new Date(pub.unlockAt).getTime() > Date.now();
              const status = isLocked ? "LOCKED" : "UNLOCKED";

              return (
                <div key={pub.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-text-primary text-sm line-clamp-1">{pub.title}</h3>
                    <StatusBadge status={status} className="shrink-0" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 text-xs font-mono">
                    <div className="text-text-muted">Category:</div>
                    <div className="text-text-primary text-right">{pub.category}</div>
                    
                    <div className="text-text-muted">Published:</div>
                    <div className="text-text-primary text-right">{new Date(pub.createdAt).toLocaleDateString()}</div>
                    
                    <div className="text-text-muted">Unlocks:</div>
                    <div className="text-text-primary text-right">{new Date(pub.unlockAt).toLocaleDateString()}</div>
                    
                    <div className="text-text-muted">Walrus Blob ID:</div>
                    <div className="text-accent-primary text-right truncate">{truncateBlobId(pub.blobId)}</div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {pub.isLocked && !isLocked && (
                      <button
                        onClick={(e) => handleUnlockOnChain(pub.id, e)}
                        disabled={unlockingId === pub.id}
                        className="btn-primary flex-1 py-2 text-xs inline-flex items-center justify-center gap-1.5 bg-accent-secondary/15 border-accent-secondary/20 hover:bg-accent-secondary/25"
                      >
                        {unlockingId === pub.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Unlock size={14} />
                        )}
                        <span>Unlock On-Chain</span>
                      </button>
                    )}
                    {!isLocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareKeyPubId(pub.id);
                          setEnteredKey("");
                          setCopiedShareMessage(false);
                        }}
                        className="btn-primary flex-1 py-2 text-xs inline-flex items-center justify-center gap-1.5"
                      >
                        <Key size={14} />
                        <span>Share Key</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => handleCopyLink(pub.id, e)}
                      className="btn-muted flex-1 py-2 text-xs inline-flex items-center justify-center gap-1.5"
                    >
                      {copiedId === pub.id ? (
                        <>
                          <Check size={14} className="text-accent-primary" />
                          <span className="text-accent-primary">Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={14} />
                          <span>Share Link</span>
                        </>
                      )}
                    </button>
                    <Link
                      href={`/verify/${pub.id}`}
                      className="btn-primary flex-1 py-2 text-xs inline-flex items-center justify-center gap-1.5"
                    >
                      <span>View details</span>
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share Key Modal */}
      {shareKeyPubId && (
        <div className="fixed inset-0 bg-background-primary/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
          <div className="bg-background-card border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShareKeyPubId(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
            >
              <X size={18} />
            </button>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key size={18} className="text-accent-primary" />
                Share Unlocked Document
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                To share this document, paste your decryption key below. You saved it when you published.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase tracking-wider block font-mono">
                  Decryption Key
                </label>
                <input
                  type="text"
                  value={enteredKey}
                  onChange={(e) => {
                    setEnteredKey(e.target.value);
                    setCopiedShareMessage(false);
                  }}
                  placeholder="Paste your decryption key"
                  className="w-full bg-background-secondary border border-white/10 rounded-lg px-3 py-2.5 text-xs font-mono text-text-primary outline-none focus:border-accent-primary"
                />
              </div>

              {enteredKey.trim() && (
                <div className="bg-background-secondary border border-white/5 rounded-lg p-3 space-y-1 font-mono text-[10px] text-text-secondary">
                  <span className="text-[9px] text-text-muted uppercase tracking-wider block">Generated Share Message</span>
                  <div className="break-all whitespace-pre-wrap">
                    {`Document: ${publications.find(p => p.id === shareKeyPubId)?.title}\nLink: ${window.location.origin}/verify/${shareKeyPubId}\nDecryption Key: ${enteredKey}`}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShareKeyPubId(null)}
                className="btn-secondary py-2.5 flex-1 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={!enteredKey.trim()}
                onClick={async () => {
                  const pub = publications.find(p => p.id === shareKeyPubId);
                  if (!pub) return;
                  const msg = `Document: ${pub.title}\nLink: ${window.location.origin}/verify/${shareKeyPubId}\nDecryption Key: ${enteredKey}`;
                  try {
                    await navigator.clipboard.writeText(msg);
                    setCopiedShareMessage(true);
                    setTimeout(() => {
                      setCopiedShareMessage(false);
                      setShareKeyPubId(null);
                    }, 2000);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="btn-primary py-2.5 flex-1 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                {copiedShareMessage ? (
                  <>
                    <Check size={14} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    <span>Copy Share Message</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
