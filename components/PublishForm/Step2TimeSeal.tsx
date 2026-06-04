"use client";

import React, { useEffect, useState } from "react";
import { Clock, Calendar, ShieldAlert, ArrowLeft, Database, Network, Eye } from "lucide-react";

interface Step2Props {
  data: {
    title: string;
    unlockType: "now" | "30days" | "1year" | "custom";
    customUnlockDate: string;
  };
  updateData: (fields: Partial<Step2Props["data"]>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2TimeSeal({ data, updateData, onNext, onBack }: Step2Props) {
  const [computedUnlockDate, setComputedUnlockDate] = useState<Date | null>(null);

  // Initialize custom date to tomorrow if empty
  useEffect(() => {
    if (!data.customUnlockDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      
      // format to YYYY-MM-DDTHH:mm
      const tzoffset = tomorrow.getTimezoneOffset() * 60000;
      const localISOTime = new Date(tomorrow.getTime() - tzoffset)
        .toISOString()
        .slice(0, 16);
      
      updateData({ customUnlockDate: localISOTime });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute live unlock date
  useEffect(() => {
    const now = new Date();
    if (data.unlockType === "now") {
      setComputedUnlockDate(null);
    } else if (data.unlockType === "30days") {
      const future = new Date();
      future.setDate(now.getDate() + 30);
      setComputedUnlockDate(future);
    } else if (data.unlockType === "1year") {
      const future = new Date();
      future.setDate(now.getDate() + 365);
      setComputedUnlockDate(future);
    } else if (data.unlockType === "custom" && data.customUnlockDate) {
      setComputedUnlockDate(new Date(data.customUnlockDate));
    }
  }, [data.unlockType, data.customUnlockDate]);

  const formatDate = (date: Date | null): string => {
    if (!date) return "Immediate (No Time Lock)";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " UTC";
  };

  const getMinDateTime = (): string => {
    // Prevent selecting dates in the past
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Minimum 5 mins from now
    const tzoffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzoffset).toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-text-primary">When should this document unlock?</h2>
        <p className="text-sm text-text-secondary">
          Once locked, nobody can unlock it early — including you.
        </p>
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Unlock Now */}
        <button
          type="button"
          onClick={() => updateData({ unlockType: "now" })}
          className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
            data.unlockType === "now"
              ? "bg-accent-primary/5 border-accent-primary shadow-[0_0_15px_rgba(0,212,180,0.15)]"
              : "bg-background-card border-white/5 hover:border-white/10"
          }`}
        >
          <div className="p-2 bg-white/5 rounded-lg text-text-secondary mb-3">
            <Eye size={16} />
          </div>
          <span className="text-sm font-semibold text-text-primary">Unlock Now</span>
          <span className="text-xs text-text-muted mt-1 leading-relaxed">
            Immediate distribution on the network.
          </span>
        </button>

        {/* Lock 30 Days */}
        <button
          type="button"
          onClick={() => updateData({ unlockType: "30days" })}
          className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
            data.unlockType === "30days"
              ? "bg-accent-primary/5 border-accent-primary shadow-[0_0_15px_rgba(0,212,180,0.15)]"
              : "bg-background-card border-white/5 hover:border-white/10"
          }`}
        >
          <div className="p-2 bg-white/5 rounded-lg text-text-secondary mb-3">
            <Clock size={16} />
          </div>
          <span className="text-sm font-semibold text-text-primary">Lock for 30 days</span>
          <span className="text-xs text-text-muted mt-1 leading-relaxed">
            Standard cryptographic delay.
          </span>
        </button>

        {/* Lock 1 Year */}
        <button
          type="button"
          onClick={() => updateData({ unlockType: "1year" })}
          className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
            data.unlockType === "1year"
              ? "bg-accent-primary/5 border-accent-primary shadow-[0_0_15px_rgba(0,212,180,0.15)]"
              : "bg-background-card border-white/5 hover:border-white/10"
          }`}
        >
          <div className="p-2 bg-white/5 rounded-lg text-text-secondary mb-3">
            <Calendar size={16} />
          </div>
          <span className="text-sm font-semibold text-text-primary">Lock for 1 year</span>
          <span className="text-xs text-text-muted mt-1 leading-relaxed">
            Long-term immutable storage.
          </span>
        </button>
      </div>

      {/* Custom Picker */}
      <div className="space-y-2">
        <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
          Or select custom date/time
        </label>
        <div className="relative">
          <input
            type="datetime-local"
            min={getMinDateTime()}
            value={data.customUnlockDate}
            onChange={(e) => updateData({ customUnlockDate: e.target.value, unlockType: "custom" })}
            className={`w-full bg-background-secondary border rounded-lg px-4 py-3 text-text-primary text-sm focus:border-accent-primary focus:shadow-glow outline-none transition-all ${
              data.unlockType === "custom" ? "border-accent-primary" : "border-white/10"
            }`}
          />
        </div>
      </div>

      {/* Warning Box */}
      {data.unlockType === "now" && (
        <div className="flex items-start gap-3 p-4 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger leading-relaxed animate-fadeIn">
          <ShieldAlert size={18} className="shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold uppercase tracking-wider text-xs mb-1">
              Warning: Immediate Release Selected
            </strong>
            Selecting &apos;Unlock Now&apos; will make your document instantly visible to anyone with the link. This action cannot be reversed.
          </div>
        </div>
      )}

      {/* Live Seal Preview Card */}
      <div className="p-5 bg-background-secondary border border-white/5 rounded-xl space-y-4">
        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-accent-primary">
          Live Seal Preview
        </h4>

        <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs md:text-sm font-mono leading-relaxed">
          <div className="text-text-secondary">Document:</div>
          <div className="text-text-primary truncate text-right font-semibold">{data.title || "Untitled"}</div>

          <div className="text-text-secondary">Lock Date:</div>
          <div className="text-text-primary text-right">
            {new Date().toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })} UTC
          </div>

          <div className="text-text-secondary">Unlock Date:</div>
          <div className={`text-right font-semibold ${data.unlockType === "now" ? "text-danger" : "text-accent-primary"}`}>
            {formatDate(computedUnlockDate)}
          </div>

          <div className="text-text-secondary flex items-center gap-1.5">
            <Database size={12} className="text-text-muted" />
            Storage Provider:
          </div>
          <div className="text-text-primary text-right flex items-center justify-end gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary"></span>
            Walrus Protocol
          </div>

          <div className="text-text-secondary flex items-center gap-1.5">
            <Network size={12} className="text-text-muted" />
            Chain Network:
          </div>
          <div className="text-text-primary text-right flex items-center justify-end gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary"></span>
            Sui
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex items-center justify-between gap-4">
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
          onClick={onNext}
          className="btn-primary flex-1 md:flex-initial"
        >
          Next Step
        </button>
      </div>
    </div>
  );
}
