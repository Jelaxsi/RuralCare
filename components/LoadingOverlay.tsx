"use client";

import { useEffect, useState } from "react";

type Props = {
  messages: string[];
  waitHint?: string;
};

export function LoadingOverlay({ messages, waitHint }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [messages.length]);

  return (
    <div
      className="loading-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center px-6 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-500 border-r-cyan-400" />
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/20 text-2xl">
            ⚕️
          </div>
        </div>
        <p className="mt-6 text-base font-medium text-white/90">{messages[index]}</p>
        {waitHint && <p className="mt-2 text-sm text-white/45">{waitHint}</p>}
      </div>
    </div>
  );
}
