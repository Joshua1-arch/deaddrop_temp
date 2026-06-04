import React from "react";

interface LoadingOverlayProps {
  isVisible: boolean;
  message: string;
}

export default function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="flex flex-col items-center justify-center p-8 bg-background-card border border-white/10 rounded-xl shadow-2xl max-w-sm w-full text-center space-y-6 mx-4">
        {/* Animated Spin Ring */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
          <div className="absolute inset-0 rounded-full border-4 border-accent-primary border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 rounded-full border-4 border-accent-primary/20 blur-sm"></div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text-primary">Processing</h3>
          <p className="text-sm font-mono text-accent-primary leading-relaxed">
            {message}
          </p>
        </div>

        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
          <div className="h-full bg-accent-primary animate-[pulse_1.5s_infinite] w-3/4 mx-auto rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
