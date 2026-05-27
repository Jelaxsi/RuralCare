"use client";

import { useEffect, useRef, useState } from "react";

type ConnectionState = "online" | "offline" | "back-online";

type Props = {
  connectedLabel: string;
  offlineLabel: string;
  backOnlineLabel: string;
  onOffline?: () => void;
};

export function TriageConnectionBar({
  connectedLabel,
  offlineLabel,
  backOnlineLabel,
  onOffline,
}: Props) {
  const [state, setState] = useState<ConnectionState>("online");
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    function update() {
      const online = navigator.onLine;
      if (!online) {
        wasOfflineRef.current = true;
        setState("offline");
        onOffline?.();
        return;
      }
      if (wasOfflineRef.current) {
        setState("back-online");
        wasOfflineRef.current = false;
        window.setTimeout(() => setState("online"), 4000);
        return;
      }
      setState("online");
    }

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [onOffline]);

  const isOffline = state === "offline";
  const isBackOnline = state === "back-online";

  const message = isBackOnline ? backOnlineLabel : isOffline ? offlineLabel : connectedLabel;
  const icon = isBackOnline ? "✓" : isOffline ? "🔴" : "🟢";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={`sticky top-16 z-30 border-b px-4 py-2 text-center text-sm font-medium transition-colors ${
        isOffline
          ? "border-amber-400/40 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100"
          : isBackOnline
            ? "border-emerald-400/40 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
            : "border-emerald-400/20 bg-emerald-50/80 text-emerald-800/90 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200/90"
      }`}
    >
      {icon} {message}
    </div>
  );
}
