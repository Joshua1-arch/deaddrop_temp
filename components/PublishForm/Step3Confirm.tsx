"use client";

import React, { useState } from "react";
import { Info, ShieldCheck, ArrowLeft, Key, Check, Download } from "lucide-react";
import CopyButton from "../CopyButton";

interface Step3Props {
  data: {
    title: string;
    category: string;
    file: File | null;
    description: string;
    unlockType: "now" | "30days" | "1year" | "custom";
    customUnlockDate: string;
    decryptionKey: string;
  };
  onPublish: () => void;
  onBack: () => void;
}

export default function Step3Confirm({ data, onPublish, onBack }: Step3Props) {
  const [keySaved, setKeySaved] = useState(false);
  const [downloadedKey, setDownloadedKey] = useState(false);

  const getUnlockDateText = () => {
    if (data.unlockType === "now") return "Immediate (No Time Lock)";
    
    const date = data.unlockType === "30days"
      ? new Date(Date.now() + 30 * 24 * 3600 * 1000)
      : data.unlockType === "1year"
      ? new Date(Date.now() + 365 * 24 * 3600 * 1000)
      : new Date(data.customUnlockDate);

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " UTC";
  };

  const getFileSizeText = () => {
    if (!data.file) return "0.0 MB";
    const sizeMb = data.file.size / (1024 * 1024);
    return `${sizeMb.toFixed(1)} MB`;
  };

  // Download key file option
  const downloadKeyFile = () => {
    try {
      const element = document.createElement("a");
      const file = new Blob(
        [
          `DEADDROP DECRYPTION KEY\n`,
          `=======================\n\n`,
          `Document: ${data.title}\n`,
          `Category: ${data.category}\n`,
          `Unlock Date: ${getUnlockDateText()}\n`,
          `Decryption Key: ${data.decryptionKey}\n\n`,
          `WARNING: Store this key securely. Without this key, you will not be able to decrypt your document once it unlocks.`
        ],
        { type: "text/plain" }
      );
      element.href = URL.createObjectURL(file);
      element.download = `${data.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_key.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setDownloadedKey(true);
      setTimeout(() => setDownloadedKey(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-text-primary">Confirm & Publish</h2>
        <p className="text-sm text-text-secondary">
          Finalize your immutable record on the Walrus storage network.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-background-secondary border border-white/5 rounded-xl p-5 space-y-3.5">
        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
          Document Summary
        </h4>
        <div className="grid grid-cols-2 gap-y-3 text-xs md:text-sm font-mono leading-relaxed">
          <div className="text-text-muted">Title:</div>
          <div className="text-text-primary text-right truncate font-semibold">{data.title}</div>
          
          <div className="text-text-muted">Category:</div>
          <div className="text-text-primary text-right">{data.category}</div>

          <div className="text-text-muted">Size:</div>
          <div className="text-text-primary text-right">{getFileSizeText()}</div>

          <div className="text-text-muted">Retention:</div>
          <div className="text-text-primary text-right">Permanent (Walrus)</div>

          <div className="text-text-muted">Access:</div>
          <div className="text-text-primary text-right font-semibold text-accent-primary">
            {data.unlockType === "now" ? "Public" : "Encrypted (AES-256)"}
          </div>
        </div>
      </div>

      {/* Network Cost Box */}
      <div className="bg-background-secondary border border-white/5 rounded-xl p-5 space-y-3">
        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
          Network Cost
        </h4>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-accent-secondary font-mono">0.01 SUI</span>
          <span className="text-xs text-text-muted">+ Walrus storage fees</span>
        </div>
        <p className="text-xs text-text-muted font-mono leading-relaxed">
          Immutable storage secured by Sui network consensus.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex items-center justify-between gap-4 font-sans">
        <button
          type="button"
          onClick={onBack}
          className="btn-muted flex-1 md:flex-initial"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          type="button"
          onClick={onPublish}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <ShieldCheck size={18} />
          Encrypt, Upload & Publish
        </button>
      </div>
    </div>
  );
}
