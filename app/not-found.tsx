"use client";

import Link from "next/link";
import { useSavedLanguage } from "@/lib/i18n/useSavedLanguage";

export default function NotFound() {
  const { t } = useSavedLanguage();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-deep px-4 text-center">
      <p className="text-6xl font-black text-violet-500">404</p>
      <h1 className="mt-4 text-2xl font-bold text-text-primary">{t.notFoundTitle}</h1>
      <p className="mt-2 max-w-md text-text-muted">{t.notFoundText}</p>
      <Link href="/" className="btn-touch mt-8 rounded-xl bg-violet-600 px-8 py-3 font-semibold text-white hover:bg-violet-500">
        {t.notFoundHome}
      </Link>
    </div>
  );
}
