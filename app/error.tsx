"use client";

import { useEffect } from "react";
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1b2a]">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-red-400/80 mb-4">500</h1>
        <h2 className="text-3xl font-semibold text-white mb-4">Something went wrong</h2>
        <p className="text-white/60 max-w-md mx-auto mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg bg-amber-300/90 text-[#0a1628] hover:bg-amber-300 transition-colors font-semibold"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/en")}
            className="px-6 py-3 rounded-lg border border-white/20 text-white/80 hover:bg-white/10 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

