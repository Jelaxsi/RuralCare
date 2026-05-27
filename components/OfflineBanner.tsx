"use client";

import { useEffect, useState } from "react";
import { getLanguageOption } from "@/lib/i18n/languages";
import { getTranslations } from "@/lib/i18n/translations";
import { LANGUAGE_STORAGE_KEY, resolveStoredLanguageCode } from "@/lib/i18n/useSavedLanguage";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [message, setMessage] = useState(
    "You are offline — voice analysis requires internet connection",
  );

  useEffect(() => {
    const code = resolveStoredLanguageCode();
    const langOption = getLanguageOption(code);
    setMessage(getTranslations(langOption.translationKey).offlineMessage);

    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-16 z-[60] border-b border-amber-500/40 bg-amber-600/90 px-4 py-2 text-center text-sm font-medium text-white"
    >
      {message}
    </div>
  );
}
