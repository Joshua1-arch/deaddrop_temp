"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/components/WalletProvider";
import { getPublicationsByOwner, tryUnlock } from "@/lib/sui";
import { useSignAndExecuteTransaction, useSignPersonalMessage } from "@mysten/dapp-kit";
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
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const [loading, setLoading] = useState(true);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  
  // Profile / Secure Inbox states
  const [profilePub, setProfilePub] = useState<Publication | null>(null);
  const [registering, setRegistering] = useState(false);

  // Share Key modal states
  const [shareKeyPubId, setShareKeyPubId] = useState<string | null>(null);
  const [enteredKey, setEnteredKey] = useState("");
  const [copiedShareMessage, setCopiedShareMessage] = useState(false);

  // Tatum subscriptions states
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [showSubModal, setShowSubModal] = useState(false);
  const [subWebhookUrl, setSubWebhookUrl] = useState("");
  const [subPubId, setSubPubId] = useState("");
  const [submittingSub, setSubmittingSub] = useState(false);

  // Webhook live logs states
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);

  const fetchWebhookLogs = async () => {
    try {
      const res = await fetch("/api/webhook-logger");
      if (res.ok) {
        const data = await res.json();
        setWebhookLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch webhook logs:", err);
    }
  };

  useEffect(() => {
    fetchWebhookLogs();
    const interval = setInterval(fetchWebhookLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadSubscriptions = async () => {
    try {
      const { getSubscriptions } = await import("@/lib/tatum");
      const list = await getSubscriptions();
      setSubscriptions(list);
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subWebhookUrl || !subPubId) return;
    setSubmittingSub(true);
    try {
      const { subscribeToUnlockNotification } = await import("@/lib/tatum");
      await subscribeToUnlockNotification(subPubId, subWebhookUrl);
      setSubWebhookUrl("");
      setSubPubId("");
      setShowSubModal(false);
      await loadSubscriptions();
    } catch (err) {
      console.error("Failed to subscribe:", err);
    } finally {
      setSubmittingSub(false);
    }
  };

  const handleSimulateWebhookAlert = async () => {
    setSimulatingWebhook(true);
    try {
      const targetPub = publications[Math.floor(Math.random() * publications.length)];
      const targetId = targetPub ? targetPub.id : "0xef840f86eb52e8dccd2d321bffbf34c6151b31dc8daa5e37302908f09044d504";
      const targetTitle = targetPub ? targetPub.title : "Decentralized Key Report";
      
      const samplePayload = {
        type: "ADDRESS_TRANSACTION",
        chain: "sui-testnet",
        address: targetId,
        txId: "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(""),
        timestamp: Date.now(),
        blockNumber: Math.floor(Math.random() * 10000000),
        publicationTitle: targetTitle,
        status: "OBJECT_MUTATED",
        detail: `Sui object ${targetId} was mutated (decrypted / unlocked) on-chain.`
      };

      await fetch("/api/webhook-logger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(samplePayload),
      });
      await fetchWebhookLogs();
    } catch (err) {
      console.error("Failed to simulate webhook:", err);
    } finally {
      setSimulatingWebhook(false);
    }
  };

  const handleUnlockOnChain = async (pubId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUnlockingId(pubId);
    try {
      await tryUnlock(pubId, signAndExecuteTransaction);
      await loadPublications();
    } catch (err) {
      console.error("Failed to unlock publication on chain:", err);
    } finally {
      setUnlockingId(null);
    }
  };

  const handleRegisterInbox = async () => {
    if (!isConnected || !address) return;
    setRegistering(true);
    try {
      // 1. Sign registration message to derive key pair
      const messageText = "Activate DeadDrop Inbox v1";
      const messageBytes = new TextEncoder().encode(messageText);
      const signResult = await signPersonalMessage({ message: messageBytes });
      
      const signatureBytes = new Uint8Array(
        atob(signResult.signature).split("").map(c => c.charCodeAt(0))
      );
      
      // 2. Generate random P-256 key pair
      const keyPair = await globalThis.crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"]
      );
      
      // Export public key as raw bytes (65 bytes)
      const pubKeyBytes = new Uint8Array(
        await globalThis.crypto.subtle.exportKey("raw", keyPair.publicKey)
      );
      
      // Derive AES key from signature bytes
      const { deriveKeyFromSignature, encryptPrivateKey } = await import("@/lib/crypto");
      const aesKey = await deriveKeyFromSignature(signatureBytes);
      
      // Encrypt the P-256 private key (PKCS#8 format) with the AES key
      const encryptedPrivKeyBytes = await encryptPrivateKey(keyPair.privateKey, aesKey);
      
      // Convert encrypted private key bytes to a hex string to store in blob_id
      const encryptedHex = Array.from(encryptedPrivKeyBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
        
      // 3. Publish profile publication on-chain via Sui
      const { Transaction } = await import("@mysten/sui/transactions");
      const { PACKAGE_ID, CLOCK_OBJECT_ID } = await import("@/lib/constants");
      
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::publication::create_publication`,
        arguments: [
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(encryptedHex))), // blob_id holding encrypted private key hex
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(""))), // sha256_hash
          tx.pure.vector("u8", Array.from(new TextEncoder().encode("DEADDROP_PROFILE"))), // title
          tx.pure.vector("u8", Array.from(new TextEncoder().encode("Profile"))), // category
          tx.pure.u64(0), // unlock_at (0 means instantly accessible)
          tx.pure.vector("u8", Array.from(pubKeyBytes)), // wrapped_key holding P-256 public key bytes
          tx.pure.address(address), // recipient (ourselves)
          tx.object(CLOCK_OBJECT_ID),
        ],
      });
      
      await signAndExecuteTransaction({ transaction: tx });
      
      // Reload dashboard
      await loadPublications();
    } catch (err) {
      console.error("Failed to register DeadDrop inbox:", err);
    } finally {
      setRegistering(false);
    }
  };

  const loadPublications = async () => {
    if (!isConnected) return;
    setLoading(true);
    try {
      const data = await getPublicationsByOwner(address);
      const profile = data.find(p => p.title === "DEADDROP_PROFILE" && p.publisher.toLowerCase() === address.toLowerCase());
      setProfilePub(profile || null);
      
      const normalPubs = data.filter(p => p.title !== "DEADDROP_PROFILE");
      setPublications(normalPubs);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublications();
    loadSubscriptions();
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
          <p className="text-sm text-text-secondary flex flex-wrap items-center gap-2">
            <span>All documents published from your wallet:</span>
            <span className="font-mono text-accent-secondary">{address.slice(0, 8)}...{address.slice(-8)}</span>
            {profilePub && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-accent-primary/15 text-accent-primary px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-wider">
                <Check size={10} /> Secure Inbox Active
              </span>
            )}
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

      {/* Registration Card if Inbox is not active */}
      {!profilePub && isConnected && (
        <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg animate-fadeIn">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Key size={20} className="text-accent-primary" />
              Activate Secure Inbox
            </h2>
            <p className="text-xs text-text-secondary max-w-xl leading-relaxed">
              Enable signature-secured wallet-to-wallet auto-decryption. By activating your inbox, other whistleblowers can target your wallet address directly when publishing time-locked files.
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-text-muted mt-2">
              <span>Need gas?</span>
              <a
                href="https://faucet.testnet.sui.io"
                target="_blank"
                rel="noreferrer"
                className="text-accent-secondary hover:underline inline-flex items-center gap-0.5"
              >
                Get Testnet SUI <ExternalLink size={10} />
              </a>
              <span className="text-text-muted/40">|</span>
              <span>Test recipient address:</span>
              <span className="font-mono text-white select-all bg-white/5 px-1 py-0.2 rounded text-[10px]">
                0xef840f86eb52e8dccd2d321bffbf34c6151b31dc8daa5e37302908f09044d504
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRegisterInbox}
            disabled={registering}
            className="btn-primary py-2.5 px-6 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
          >
            {registering ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Activating...</span>
              </>
            ) : (
              <span>Activate Inbox</span>
            )}
          </button>
        </div>
      )}

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

      {/* Tatum Webhook Notifications Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Layers size={18} className="text-accent-secondary animate-pulse" />
              Tatum Webhook Notifications
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed font-sans">
              Deploy automated Tatum webhooks to monitor publication status changes on the Sui blockchain.
            </p>
          </div>
          <button
            onClick={() => setShowSubModal(true)}
            className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Add Notification Webhook</span>
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-background-card border border-white/5 rounded-xl p-8 text-center text-text-muted text-xs font-mono">
            No active Tatum notification webhooks found. Webhooks defined during publish appear here.
          </div>
        ) : (
          <div className="bg-background-card border border-white/5 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-mono text-text-secondary uppercase tracking-wider">
                    <th className="p-4 font-semibold">Subscription ID</th>
                    <th className="p-4 font-semibold">Target Address / Publication</th>
                    <th className="p-4 font-semibold">Webhook URL</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-text-secondary">
                  {subscriptions.map((sub: any) => {
                    const matchedPub = publications.find(p => p.id === sub.address);
                    return (
                      <tr key={sub.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 font-mono select-all text-text-primary text-[11px]">
                          {sub.id}
                        </td>
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-white block">
                              {matchedPub ? matchedPub.title : "Publication Object"}
                            </span>
                            <span className="font-mono text-[10px] text-text-muted block">
                              {sub.address}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-mono break-all text-[11px]">
                          {sub.url}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-accent-primary/20 text-accent-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-ping"></span>
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Tatum Webhook Event Logger & Playground */}
      <div className="bg-background-card border border-white/5 rounded-xl p-6 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-secondary animate-pulse inline-block"></span>
              Live Webhook Event Logger
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Listen to active Tatum subscriptions firing real-time events. You can also trigger simulated events to preview webhook payloads.
            </p>
          </div>
          <button
            onClick={handleSimulateWebhookAlert}
            disabled={simulatingWebhook}
            className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 shrink-0 bg-accent-secondary/15 border-accent-secondary/20 hover:bg-accent-secondary/25 text-accent-secondary hover:text-white"
          >
            {simulatingWebhook ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            <span>Simulate Tatum Webhook</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Logs List */}
          <div className="border border-white/5 bg-background-secondary rounded-lg h-60 overflow-y-auto divide-y divide-white/5">
            {webhookLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted text-xs font-mono p-4 text-center">
                <span>Waiting for events...</span>
                <span className="text-[10px] text-text-muted/60 mt-1">
                  (Webhooks registered on Tatum will automatically log here, or click Simulate)
                </span>
              </div>
            ) : (
              webhookLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-3 text-xs font-mono cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                    selectedLog?.id === log.id ? "bg-white/5 text-accent-primary" : "hover:bg-white/[0.02] text-text-secondary"
                  }`}
                >
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-secondary/10 text-accent-secondary uppercase font-semibold">
                        {log.type}
                      </span>
                      <span className="text-white font-semibold">
                        {log.payload.publicationTitle || "Object Mutation"}
                      </span>
                    </div>
                    <div className="text-[10px] text-text-muted truncate select-all">
                      TX: {log.payload.txId}
                    </div>
                  </div>
                  <span className="text-[10px] text-text-muted shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Log Preview */}
          <div className="border border-white/5 bg-background-secondary rounded-lg h-60 flex flex-col overflow-hidden">
            <div className="border-b border-white/5 bg-white/[0.01] px-4 py-2 flex items-center justify-between text-[10px] font-mono text-text-muted uppercase tracking-wider">
              <span>Payload Inspector</span>
              {selectedLog && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedLog.payload, null, 2));
                  }}
                  className="hover:text-accent-primary font-sans lowercase font-semibold"
                >
                  Copy JSON
                </button>
              )}
            </div>
            <div className="flex-1 p-4 font-mono text-[11px] overflow-auto select-all text-accent-primary">
              {selectedLog ? (
                <pre>{JSON.stringify(selectedLog.payload, null, 2)}</pre>
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-xs text-center p-4">
                  Select a live webhook event from the list to inspect the full Tatum payload.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Subscription Modal */}
      {showSubModal && (
        <div className="fixed inset-0 bg-background-primary/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
          <div className="bg-background-card border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowSubModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
            >
              <X size={18} />
            </button>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus size={18} className="text-accent-primary" />
                Subscribe to Publication Webhook
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Configure a webhook to be notified by Tatum when state transitions happen on this publication object on-chain.
              </p>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase tracking-wider block font-mono">
                  Select Publication
                </label>
                <select
                  value={subPubId}
                  onChange={(e) => setSubPubId(e.target.value)}
                  required
                  className="w-full bg-background-secondary border border-white/10 rounded-lg px-3 py-2.5 text-xs text-text-primary outline-none focus:border-accent-primary"
                >
                  <option value="">-- Choose Publication --</option>
                  {publications.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.id.slice(0, 10)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase tracking-wider block font-mono">
                  Webhook URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-webhook-endpoint.com/api"
                  value={subWebhookUrl}
                  onChange={(e) => setSubWebhookUrl(e.target.value)}
                  required
                  className="w-full bg-background-secondary border border-white/10 rounded-lg px-3 py-2.5 text-xs font-mono text-text-primary outline-none focus:border-accent-primary"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="btn-secondary py-2.5 flex-1 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSub || !subPubId || !subWebhookUrl}
                  className="btn-primary py-2.5 flex-1 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {submittingSub ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <span>Subscribe</span>
                  )}
                </button>
              </div>
            </form>
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
