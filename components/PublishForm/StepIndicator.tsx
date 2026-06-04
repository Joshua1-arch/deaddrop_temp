import React from "react";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: "Document" },
    { number: 2, label: "Time Seal" },
    { number: 3, label: "Confirm & Publish" },
  ];

  return (
    <div className="w-full max-w-xl mx-auto mb-8 px-4">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 -translate-y-1/2 z-0"></div>
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-accent-primary -translate-y-1/2 z-0 transition-all duration-500 ease-in-out"
          style={{
            width: `${((Math.max(1, currentStep) - 1) / (steps.length - 1)) * 100}%`,
          }}
        ></div>

        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;

          return (
            <div key={step.number} className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border font-semibold font-mono text-sm transition-all duration-300 ${
                  isCompleted
                    ? "bg-accent-primary border-accent-primary text-background-primary shadow-[0_0_10px_rgba(0,212,180,0.3)]"
                    : isActive
                    ? "bg-background-card border-accent-primary text-accent-primary shadow-[0_0_15px_rgba(0,212,180,0.2)] scale-110"
                    : "bg-background-secondary border-white/10 text-text-secondary"
                }`}
              >
                {isCompleted ? <Check size={16} className="stroke-[3]" /> : step.number}
              </div>
              <span
                className={`text-[10px] md:text-xs font-semibold uppercase tracking-wider mt-2.5 transition-colors duration-300 ${
                  isActive ? "text-accent-primary font-bold" : isCompleted ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
