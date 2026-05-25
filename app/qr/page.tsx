"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";

export default function QrPage() {
  const [appUrl, setAppUrl] = useState("https://ruralcare.app");
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "ruralcare-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  return (
    <div className="min-h-screen bg-deep">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col items-center px-4 pb-10 pt-[calc(64px+32px)] text-center">
        <h1 className="hero-title mb-2">QR Access</h1>
        <p className="mb-8 text-sm text-white/55">
          Scan to access RuralCare Emergency Triage. Print and post at clinics for quick patient access.
        </p>

        <div ref={canvasRef} className="rounded-2xl bg-white p-6 shadow-lg">
          <QRCodeCanvas value={appUrl} size={220} level="M" includeMargin />
        </div>

        <p className="mt-4 break-all text-xs text-white/40">{appUrl}</p>

        <button
          type="button"
          onClick={downloadPng}
          className="btn-touch mt-6 rounded-xl bg-violet-600 px-6 font-semibold text-white hover:bg-violet-500"
        >
          Download QR Code
        </button>

        <Link href="/" className="btn-touch mt-4 text-sm text-violet-400 underline">
          ← Back to Triage
        </Link>
      </main>
      <AppFooter />
    </div>
  );
}
