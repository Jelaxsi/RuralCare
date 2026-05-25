"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[PWA] Service worker registration failed:", err);
    });
  }, []);

  return null;
}
