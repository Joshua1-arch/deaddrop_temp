"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  ShieldCheck,
  Share2,
  Database,
  CalendarDays,
  FileKey,
  Flame,
  ArrowRight,
  Search,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [searchId, setSearchId] = useState("");
  const [searchError, setSearchError] = useState("");

  const handleVerifySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) {
      setSearchError("Please enter a publication ID.");
      return;
    }
    setSearchError("");
    router.push(`/verify/${searchId.trim()}`);
  };

  const steps = [
    {
      icon: <UploadCloud className="text-accent-primary" size={24} />,
      title: "1. Upload & Encrypt",
      desc: "You upload any document. It's encrypted in your browser before it touches any server. Only you hold the key.",
    },
    {
      icon: <CalendarDays className="text-accent-primary" size={24} />,
      title: "2. Lock with a Time Seal",
      desc: "Set an unlock date. A Move smart contract on Sui enforces it. Nobody — not even us — can unlock it early.",
    },
    {
      icon: <Share2 className="text-accent-primary" size={24} />,
      title: "3. Share Proof Forever",
      desc: "Get a permanent verification link. Anyone can confirm your document existed at that exact time, on-chain.",
    },
  ];

  const features = [
    {
      icon: <Database className="text-accent-secondary shrink-0" size={22} />,
      title: "Truly Decentralized Storage",
      desc: "Documents stored on Walrus, a distributed storage network by Mysten Labs. No single point of failure or centralized control.",
    },
    {
      icon: <ShieldCheck className="text-accent-primary shrink-0" size={22} />,
      title: "Tamper-Proof Timestamps",
      desc: "Anchored permanently to Sui blockchain consensus. The publication proof, hash, and unlock conditions are completely immutable.",
    },
    {
      icon: <FileKey className="text-accent-secondary shrink-0" size={22} />,
      title: "Client-Side Encryption",
      desc: "AES-256-GCM encryption key generation happens in-browser. Your key never leaves your device. We literally cannot read your files.",
    },
    {
      icon: <Flame className="text-accent-primary shrink-0" size={22} />,
      title: "Censorship Resistant",
      desc: "No corporation, host, or administrator can remove, override, or suppress your document once locked and broadcast.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 hero-radial-glow px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-text-secondary select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse"></span>
            Powered by <strong className="text-accent-primary font-bold">Walrus</strong> + <strong className="text-accent-secondary font-bold">Sui</strong>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Publish the truth. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
              Lock it in time.
            </span>{" "}
            Forever.
          </h1>

          {/* Subheading */}
          <p className="text-sm md:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            DeadDrop stores your documents on Walrus decentralized storage and anchors proof of existence permanently on Sui blockchain. No one can suppress, alter, or deny what you published — not even us.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/publish" className="btn-primary w-full sm:w-auto text-center group">
              Publish a Document
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/verify/locked-demo" className="btn-secondary w-full sm:w-auto text-center">
              Verify a Document
            </Link>
          </div>
        </div>
      </section>

      {/* Verify Lookup Box Widget */}
      <section className="px-4 -mt-4 mb-16 relative z-20">
        <div className="max-w-xl mx-auto bg-background-secondary border border-white/10 rounded-xl p-5 shadow-2xl space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-text-primary">Instant Document Verification</h3>
            <p className="text-xs text-text-muted">Enter a Sui publication address or transaction hash to verify.</p>
          </div>
          
          <form onSubmit={handleVerifySearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="e.g. locked-demo, unlocked-demo, or Sui address"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full bg-background-primary border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary outline-none transition-all"
              />
            </div>
            <button type="submit" className="btn-primary py-2 px-4 text-xs font-semibold shrink-0">
              Verify
            </button>
          </form>
          {searchError && <p className="text-xs text-danger font-semibold font-mono">{searchError}</p>}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-background-secondary/30 px-4 border-y border-white/5">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">How DeadDrop Works</h2>
            <div className="h-0.5 w-12 bg-accent-primary mx-auto rounded-full mt-3"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, idx) => (
              <div key={idx} className="card-custom flex flex-col space-y-4 hover:-translate-y-1">
                <div className="p-3 bg-white/5 rounded-lg w-fit">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-text-primary">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why DeadDrop Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Why DeadDrop?</h2>
            <p className="text-sm text-text-secondary max-w-md mx-auto mt-2">
              In an era of digital volatility and centralized control, DeadDrop provides the tools for permanent record keeping.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="card-custom flex items-start gap-4 hover:-translate-y-0.5">
                <div className="p-2.5 bg-white/5 rounded-lg">
                  {feature.icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-text-primary">{feature.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
