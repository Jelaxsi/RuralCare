"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { ThemeToggle } from "@/components/SystemStatus";
import { useSavedLanguage } from "@/lib/i18n/useSavedLanguage";

const APP_URL = "https://rural-care-swart.vercel.app";

export default function QrPage() {
  const { t, langOption } = useSavedLanguage();
  const [appUrl, setAppUrl] = useState(APP_URL);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin.includes("localhost")) {
      setAppUrl(window.location.origin);
    }
  }, []);

  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "ruralcare-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  const printQr = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="min-h-screen bg-deep">
      <AppHeader right={<ThemeToggle translationLang={langOption.translationKey} />} />
      <main className="mx-auto flex max-w-md flex-col items-center px-4 pb-10 pt-[calc(64px+32px)] text-center print:pt-8">
        <h1 className="hero-title mb-2">{t.qrTitle}</h1>
        <p className="mb-8 text-sm text-text-muted">{t.qrSubtitle}</p>

        <div ref={canvasRef} className="rounded-2xl bg-white p-6 shadow-lg print:shadow-none">
          <QRCodeCanvas value={appUrl} size={300} level="M" includeMargin />
        </div>

        <p className="mt-6 text-base font-semibold text-text-primary">{t.qrScanLabel}</p>
        <p className="mt-2 break-all text-xs text-text-muted">{appUrl}</p>

        <div className="no-print mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={downloadPng}
            className="btn-touch rounded-xl bg-violet-600 px-6 font-semibold text-white hover:bg-violet-500"
          >
            {t.qrDownload}
          </button>
          <button
            type="button"
            onClick={printQr}
            className="btn-touch rounded-xl border border-border px-6 font-semibold text-text-primary hover:bg-surface-muted"
          >
            Print
          </button>
        </div>

        <Link href="/" className="btn-touch no-print mt-4 text-sm text-violet-400 underline">
          {t.qrBack}
        </Link>
      </main>
      <AppFooter />
    </div>
  );
}
