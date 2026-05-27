"use client";

import { useEffect, useState } from "react";
import { getLanguageOption, LANGUAGE_OPTIONS, type LanguageCode } from "./languages";
import { getTranslations } from "./translations";

export const LANGUAGE_STORAGE_KEY = "ruralcare-language";

export function resolveStoredLanguageCode(): LanguageCode {
  if (typeof window === "undefined") return "english";
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && LANGUAGE_OPTIONS.some((l) => l.code === saved)) {
    return saved as LanguageCode;
  }
  return "english";
}

export function useSavedLanguage() {
  const [languageCode, setLanguageCode] = useState<LanguageCode>("english");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLanguageCode(resolveStoredLanguageCode());
    setReady(true);
  }, []);

  const langOption = getLanguageOption(languageCode);
  const t = getTranslations(langOption.translationKey);

  return { languageCode, setLanguageCode, langOption, t, ready };
}
