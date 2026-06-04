"use client";

import React, { useState, useRef } from "react";
import { Upload, Lock, FileText, X, AlertCircle } from "lucide-react";
import { Category } from "@/types/publication";

interface Step1Props {
  data: {
    title: string;
    category: string;
    file: File | null;
    description: string;
  };
  updateData: (fields: Partial<Step1Props["data"]>) => void;
  onNext: () => void;
}

export default function Step1Document({ data, updateData, onNext }: Step1Props) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: Category[] = [
    "Investigative Report",
    "Legal Document",
    "Contract",
    "Evidence",
    "Personal Record",
    "Other",
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError("File exceeds maximum 50MB limit.");
      return false;
    }
    setError("");
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        updateData({ file, title: data.title || file.name.split(".").slice(0, -1).join(".") });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        updateData({ file, title: data.title || file.name.split(".").slice(0, -1).join(".") });
      }
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateData({ file: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.title.trim()) {
      setError("Document title is required.");
      return;
    }
    if (!data.file) {
      setError("Please select or drop a file to publish.");
      return;
    }
    setError("");
    onNext();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-xl mx-auto">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm font-semibold animate-fadeIn">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Document Title */}
      <div className="space-y-2">
        <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
          Document Title <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateData({ title: e.target.value })}
          placeholder="e.g. Contract signed by John Doe"
          className="w-full bg-background-secondary border border-white/10 rounded-lg px-4 py-3 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-primary focus:shadow-glow transition-all outline-none"
          required
        />
      </div>

      {/* Category Dropdown */}
      <div className="space-y-2">
        <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
          Category
        </label>
        <div className="relative">
          <select
            value={data.category}
            onChange={(e) => updateData({ category: e.target.value })}
            className="w-full bg-background-secondary border border-white/10 rounded-lg px-4 py-3 text-text-primary text-sm focus:border-accent-primary focus:shadow-glow transition-all outline-none appearance-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-background-secondary text-text-primary">
                {cat}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
            ▼
          </div>
        </div>
      </div>

      {/* File Upload Zone */}
      <div className="space-y-2">
        <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
          File Upload <span className="text-danger">*</span>
        </label>

        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
            dragActive
              ? "border-accent-primary bg-accent-primary/5 shadow-glow"
              : data.file
              ? "border-accent-primary/40 bg-background-secondary"
              : "border-white/10 bg-background-secondary/50 hover:border-accent-primary/40 hover:bg-background-secondary"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.docx,.txt,.jpg,.png,.zip"
          />

          {data.file ? (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between p-3 bg-background-card border border-white/5 rounded-lg max-w-md mx-auto">
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2 bg-accent-primary/10 rounded text-accent-primary">
                    <FileText size={20} />
                  </div>
                  <div className="text-left truncate">
                    <p className="text-sm font-semibold text-text-primary truncate">{data.file.name}</p>
                    <p className="text-xs text-text-muted">{formatBytes(data.file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 rounded-full hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-accent-primary font-mono">
                File loaded. Click or drag another file to replace it.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-text-secondary group-hover:text-accent-primary transition-colors">
                <Upload size={22} className="text-text-secondary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-primary">
                  Drag your document here or <span className="text-accent-primary font-semibold">click to browse</span>
                </p>
                <p className="text-xs text-text-muted">
                  Supports PDF, DOCX, TXT, JPG, PNG — max 50MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Client-Side Encryption Note */}
        <div className="flex items-start gap-2.5 p-3.5 bg-accent-primary/5 border border-accent-primary/10 rounded-lg text-xs text-text-secondary leading-relaxed">
          <Lock size={16} className="text-accent-primary shrink-0 mt-0.5" />
          <span>
            This file will be encrypted using <strong className="text-text-primary font-semibold">AES-256-GCM</strong> directly in your browser before upload.
            Your raw plaintext files are never sent to any server.
          </span>
        </div>
      </div>

      {/* Description Textarea */}
      <div className="space-y-2">
        <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
          Brief Description <span className="text-text-muted font-normal">(Optional)</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
          placeholder="Add context for those who verify or access this document..."
          className="w-full bg-background-secondary border border-white/10 rounded-lg px-4 py-3 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-primary focus:shadow-glow transition-all outline-none resize-none h-28"
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex justify-end">
        <button type="submit" className="btn-primary w-full md:w-auto">
          Next Step →
        </button>
      </div>
    </form>
  );
}
