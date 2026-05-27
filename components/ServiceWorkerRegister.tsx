"use client";

import { useEffect } from "react";

const SW_VERSION = "3";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") return;

    const versionKey = "ruralcare-sw-version";
    const stored = localStorage.getItem(versionKey);

    const register = () =>
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("[PWA] Service worker registration failed:", err);
      });

    if (stored === SW_VERSION) {
      void register();
      return;
    }

    // One-time cleanup: old SW cached HTML + /_next chunks and broke the app after deploys.
    void navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .then(() => {
        localStorage.setItem(versionKey, SW_VERSION);
        return register();
      });
  }, []);

  return null;
}
