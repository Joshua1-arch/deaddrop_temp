"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/components/WalletProvider";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import StepIndicator from "@/components/PublishForm/StepIndicator";
import Step1Document from "@/components/PublishForm/Step1Document";
import Step2TimeSeal from "@/components/PublishForm/Step2TimeSeal";
import Step3Confirm from "@/components/PublishForm/Step3Confirm";
import LoadingOverlay from "@/components/LoadingOverlay";
import { generateKey } from "@/lib/crypto";
import { publishDocument } from "@/lib/publish";
import { 
  Wallet, 
  CheckCircle2, 
  ExternalLink, 
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Download,
  Copy,
  Key
} from "lucide-react";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";
 
export default function PublishPage() {
  const { isConnected, connect, address } = useWallet();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [step, setStep] = useState(1);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "Investigative Report",
    file: null as File | null,
    description: "",
    unlockType: "now" as "now" | "30days" | "1year" | "custom",
    customUnlockDate: "",
    decryptionKey: "",
    subscribeWebhook: false,
    webhookUrl: "",
    recipientAddress: "",
    decryptAccess: "public" as "public" | "recipient",
  });

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Success State
  const [successDetails, setSuccessDetails] = useState<{
    publicationId: string;
    blobId: string;
    txHash: string;
    decryptionKey: string;
  } | null>(null);
  const [hasBackedUpKey, setHasBackedUpKey] = useState(false);

  // Generate a key once when the client mounts (so it's available)
  useEffect(() => {
    async function initKey() {
      if (!formData.decryptionKey) {
        const key = await generateKey();
        setFormData((prev) => ({ ...prev, decryptionKey: key }));
      }
    }
    initKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intercept tab closing or reloads if key is not backed up after publish
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step === 4 && successDetails && !hasBackedUpKey) {
        e.preventDefault();
        e.returnValue = "CRITICAL: You have not saved your Decryption Key. If you leave now, your document cannot be decrypted. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [step, successDetails, hasBackedUpKey]);

  const updateFormData = (fields: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handlePublishSubmit = async () => {
    if (!formData.file) return;

    setIsSubmitting(true);
    setError(null);
    setHasBackedUpKey(false);
    
    try {
      // Calculate unlock date string
      let unlockAt = new Date().toISOString();
      if (formData.unlockType === "30days") {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        unlockAt = d.toISOString();
      } else if (formData.unlockType === "1year") {
        const d = new Date();
        d.setDate(d.getDate() + 365);
        unlockAt = d.toISOString();
      } else if (formData.unlockType === "custom" && formData.customUnlockDate) {
        unlockAt = new Date(formData.customUnlockDate).toISOString();
      } else if (formData.unlockType === "now") {
        unlockAt = new Date(Date.now() - 1000).toISOString(); // unlock in past = instantly open
      }

      const result = await publishDocument(
        {
          title: formData.title,
          category: formData.category,
          description: formData.description,
          file: formData.file,
          unlockAt,
          recipientAddress: formData.decryptAccess === "recipient" ? formData.recipientAddress : undefined,
        },
        signAndExecuteTransaction,
        (step, detail) => {
          if (step === 'encrypting') {
            setLoadingMessage("Encrypting your document...");
          } else if (step === 'uploading') {
            setLoadingMessage("Uploading to Walrus...");
          } else if (step === 'minting') {
            setLoadingMessage("Minting on Sui blockchain...");
          } else if (step === 'complete') {
            setLoadingMessage("Document successfully published!");
          }
        }
      );

      // Optional: Tatum Webhook Notification Subscription
      if (formData.subscribeWebhook && formData.webhookUrl.trim()) {
        try {
          setLoadingMessage("Setting up Tatum webhook notifications...");
          const { subscribeToTatumNotifications } = await import("@/lib/sui");
          await subscribeToTatumNotifications(result.objectId, formData.webhookUrl.trim());
        } catch (webhookErr) {
          console.error("Failed to subscribe to Tatum notifications:", webhookErr);
        }
      }

      // Save key back to formData for compatibility
      updateFormData({ decryptionKey: result.decryptionKey });

      setSuccessDetails({
        publicationId: result.objectId,
        blobId: result.blobId,
        txHash: result.transactionDigest,
        decryptionKey: result.decryptionKey,
      });

      setStep(4); // Success step
    } catch (err: any) {
      console.error("Publishing failure:", err);
      setError(err.message || String(err));
    } finally {
      setIsSubmitting(false);
      setLoadingMessage("");
    }
  };

  const downloadKeyFileAfterPublish = () => {
    if (!successDetails) return;
    try {
      const decryptionKey = successDetails.decryptionKey;
      const objectId = successDetails.publicationId;
      const blob = new Blob([decryptionKey], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deaddrop-key-${objectId.slice(0,8)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setHasBackedUpKey(true);
    } catch (e) {
      console.error(e);
    }
  };

  const copyKeyAfterPublish = async () => {
    if (!successDetails) return;
    try {
      await navigator.clipboard.writeText(successDetails.decryptionKey);
      alert("Decryption key copied to clipboard! Keep it in a safe place.");
      setHasBackedUpKey(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getVerifyUrl = () => {
    if (typeof window === "undefined" || !successDetails) return "deaddrop.xyz/verify/...";
    return `${window.location.origin}/verify/${successDetails.publicationId}`;
  };

  const copyVerifyUrl = async () => {
    try {
      await navigator.clipboard.writeText(getVerifyUrl());
      alert("Verification link copied to clipboard!");
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Render Wallet Not Connected State
  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="card-custom max-w-md w-full text-center p-8 space-y-6 flex flex-col items-center">
          <div className="p-4 bg-white/5 border border-white/5 rounded-full text-text-secondary">
            <Wallet size={36} className="text-text-secondary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-text-primary">Connect Wallet to Publish</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              To upload files to Walrus and register cryptographic seals on the Sui blockchain, you must connect a Sui wallet.
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
    <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 space-y-8 flex flex-col justify-center">
      {/* Title */}
      {step < 4 && (
        <div className="text-center space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Publish New Secret</h1>
          <p className="text-sm text-text-secondary">
            Immutable document storage secured by Walrus Protocol and Sui Network.
          </p>
        </div>
      )}

      {/* Step Indicators */}
      {step < 4 && <StepIndicator currentStep={step} />}

      {/* Form Content */}
      <div className="bg-background-card border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl relative">
        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-start gap-3 text-danger text-sm">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white">Publishing Failed</span>
              <p className="text-text-secondary leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <Step1Document
            data={formData}
            updateData={updateFormData}
            onNext={handleNext}
          />
        )}
        
        {step === 2 && (
          <Step2TimeSeal
            data={formData}
            updateData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {step === 3 && (
          <Step3Confirm
            data={formData}
            onPublish={handlePublishSubmit}
            onBack={handleBack}
          />
        )}

        {/* Step 4: Success View */}
        {step === 4 && successDetails && (
          <div className="space-y-8 text-center py-4 max-w-xl mx-auto">
            {/* Mandatory Backup Overlay Modal */}
            {!hasBackedUpKey && (
              <div className="fixed inset-0 bg-background-primary/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
                <div className="bg-background-card border border-white/10 rounded-2xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-[0_0_50px_rgba(235,94,40,0.15)] text-center">
                  <div className="mx-auto w-16 h-16 bg-warning/10 border border-warning/20 rounded-full flex items-center justify-center text-warning animate-pulse">
                    <ShieldAlert size={36} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Decryption Key Backup Required
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      DeadDrop operates on a strict <strong className="text-white font-semibold">zero-knowledge, zero-server</strong> architecture. 
                      Your decryption key is generated and used entirely in your browser. We <strong className="text-warning font-semibold">never</strong> store, transmit, or have any access to your key.
                    </p>
                    <p className="text-xs text-[#FF4D4D] leading-relaxed font-semibold">
                      This key is not stored anywhere. If you lose it, your document can never be decrypted. Not by you, not by DeadDrop, not by anyone.
                    </p>
                  </div>

                  {/* Key Box */}
                  <div className="bg-background-secondary border border-white/5 rounded-xl p-4 space-y-2 font-mono text-xs md:text-sm">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block">Your Unique Decryption Key</span>
                    <div className="bg-background-primary border border-white/10 rounded-lg py-3 px-2 text-accent-primary break-all select-all font-semibold tracking-wider">
                      {successDetails.decryptionKey}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-sans">
                    <button
                      onClick={downloadKeyFileAfterPublish}
                      className="btn-primary py-3 text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <Download size={14} />
                      Download Key
                    </button>
                    <button
                      onClick={copyKeyAfterPublish}
                      className="btn-secondary py-3 text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <Copy size={14} />
                      Copy Key
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Top Badge */}
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 bg-success/10 rounded-full text-success ring-8 ring-success/5 animate-[bounce_1s_infinite]">
                <CheckCircle2 size={44} className="stroke-[2.5]" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary">Secret Sealed Successfully</h2>
              <p className="text-sm text-text-secondary">
                Your document has been encrypted, uploaded to Walrus, and anchored on the Sui blockchain.
              </p>
            </div>

            {/* Identifiers Card */}
            <div className="bg-background-secondary border border-white/5 rounded-xl p-5 text-left space-y-4 font-mono text-xs md:text-sm">
              <div className="space-y-1">
                <span className="text-text-muted text-[10px] uppercase tracking-wider block">Publication Object ID</span>
                <div className="flex items-center justify-between gap-2 bg-background-primary px-3 py-2 border border-white/5 rounded">
                  <span className="text-accent-secondary truncate">{successDetails.publicationId}</span>
                  <CopyButton text={successDetails.publicationId} size={12} />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-text-muted text-[10px] uppercase tracking-wider block">Walrus Blob ID</span>
                <div className="flex items-center justify-between gap-2 bg-background-primary px-3 py-2 border border-white/5 rounded">
                  <span className="text-accent-primary truncate">{successDetails.blobId}</span>
                  <CopyButton text={successDetails.blobId} size={12} />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-text-muted text-[10px] uppercase tracking-wider block">Sui Transaction Digest</span>
                <div className="flex items-center justify-between gap-2 bg-background-primary px-3 py-2 border border-white/5 rounded">
                  <span className="text-text-secondary truncate">{successDetails.txHash}</span>
                  <CopyButton text={successDetails.txHash} size={12} />
                </div>
              </div>
            </div>

            {/* Verification Link Row */}
            <div className="space-y-2">
              <span className="text-text-secondary text-xs font-semibold block">Share Verification Link</span>
              <div className="flex items-center gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  readOnly
                  value={getVerifyUrl()}
                  className="flex-1 bg-background-secondary border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-text-primary outline-none"
                />
                <button
                  onClick={copyVerifyUrl}
                  className="btn-primary text-xs font-semibold px-4 py-2 shrink-0"
                >
                  Copy Link
                </button>
              </div>
            </div>

            {/* Warning Box */}
            <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg text-left text-xs leading-relaxed text-warning">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <strong className="block text-text-primary font-bold mb-0.5">
                  Save Your Decryption Key!
                </strong>
                You will need the decryption key <code className="bg-background-primary px-1 py-0.5 rounded text-accent-primary font-mono text-xs">{successDetails.decryptionKey}</code> to unlock and read this document. It cannot be recovered from Sui or Walrus if lost.
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-4">
              <Link href={`/verify/${successDetails.publicationId}`} className="btn-primary w-full sm:w-auto">
                Verify Document
                <ArrowRight size={14} />
              </Link>
              <a
                href={`https://suiscan.xyz/testnet/tx/${successDetails.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-1.5"
              >
                <span>View on SuiScan</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlays */}
      <LoadingOverlay isVisible={isSubmitting} message={loadingMessage} />
    </div>
  );
}
