"use client";

import Link from "next/link";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { ThemeToggle } from "@/components/SystemStatus";
import { LANGUAGE_OPTIONS } from "@/lib/i18n/languages";
import { useSavedLanguage } from "@/lib/i18n/useSavedLanguage";

const TECH_STACK = [
  { name: "Valsea", role: "aboutTechValsea", icon: "🎙" },
  { name: "Groq AI", role: "aboutTechGroq", icon: "⚡" },
  { name: "Next.js", role: "aboutTechNext", icon: "▲" },
  { name: "Vercel", role: "aboutTechVercel", icon: "▲" },
] as const;

export default function AboutPage() {
  const { t, langOption } = useSavedLanguage();

  return (
    <div className="min-h-screen bg-deep">
      <AppHeader
        showAbout={false}
        right={<ThemeToggle translationLang={langOption.translationKey} />}
      />

      <main className="mx-auto max-w-4xl px-4 pb-10 pt-[calc(64px+32px)]">
        {/* Section 1 — Hero */}
        <section className="mb-12 text-center">
          <h1 className="landing-gradient-title mb-3">{t.aboutHeroTitle}</h1>
          <p className="mx-auto max-w-xl text-base text-text-muted">{t.aboutHeroSubtitle}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[t.aboutStatLanguages, t.aboutStatTriage, t.aboutStatInstall].map((stat) => (
              <span
                key={stat}
                className="rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-600 dark:text-violet-300"
              >
                {stat}
              </span>
            ))}
          </div>
        </section>

        {/* Section 2 — Mission */}
        <section className="result-card-premium mb-6 !mx-0">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-violet-400">{t.aboutMission}</h2>
          <p className="text-sm leading-relaxed text-text-secondary">{t.aboutMissionText}</p>
        </section>

        {/* Section 3 — How it works */}
        <section className="result-card-premium mb-6 !mx-0">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-violet-400">{t.aboutHowTitle}</h2>
          <ol className="grid gap-4 sm:grid-cols-2">
            {[
              { step: "1", text: t.aboutStep1, icon: "🎙" },
              { step: "2", text: t.aboutStep2, icon: "🤖" },
              { step: "3", text: t.aboutStep3, icon: "🩹" },
              { step: "4", text: t.aboutStep4, icon: "🏥" },
            ].map((item) => (
              <li key={item.step} className="flex gap-3 rounded-xl border border-border bg-surface-muted p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-lg">
                  {item.icon}
                </span>
                <div>
                  <span className="text-xs font-bold text-violet-400">Step {item.step}</span>
                  <p className="mt-1 text-sm text-text-secondary">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Section 4 — Languages */}
        <section className="result-card-premium mb-6 !mx-0">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-violet-400">{t.aboutLanguagesTitle}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {LANGUAGE_OPTIONS.filter(
              (l, i, arr) => arr.findIndex((x) => x.translationKey === l.translationKey) === i,
            ).map((lang) => (
              <div
                key={lang.translationKey}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-text-secondary"
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.label.replace(/ \(.+\)/, "")}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5 — Technology */}
        <section className="result-card-premium mb-6 !mx-0">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-violet-400">{t.aboutTechTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {TECH_STACK.map((tech) => (
              <div key={tech.name} className="flex gap-3 rounded-xl border border-border p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xl dark:bg-white/10">
                  {tech.icon}
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{tech.name}</p>
                  <p className="mt-1 text-sm text-text-muted">{t[tech.role]}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-text-muted">
            {t.aboutBuiltWith}: Next.js · Groq AI · Valsea STT · OpenStreetMap · Vercel
          </p>
          <p className="mt-1 text-xs text-text-muted">{t.aboutVersion} 0.1.0</p>
        </section>

        {/* Section 6 — Disclaimer */}
        <section className="mb-6 rounded-2xl border-2 border-amber-300/50 bg-amber-50 p-6 dark:border-amber-500/30 dark:bg-amber-500/10">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            ⚠ {t.aboutDisclaimer}
          </h2>
          <p className="text-sm leading-relaxed text-amber-900/80 dark:text-amber-100/70">{t.aboutDisclaimerText}</p>
        </section>

        {/* Section 7 — Contact */}
        <section className="result-card-premium mb-8 !mx-0">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-violet-400">{t.aboutContact}</h2>
          <p className="text-sm text-text-secondary">{t.aboutContactText}</p>
          <a
            href="https://github.com/Jelaxsi/RuralCare"
            className="mt-3 inline-block text-sm text-violet-400 underline"
            target="_blank"
            rel="noreferrer"
          >
            github.com/Jelaxsi/RuralCare
          </a>
        </section>

        <Link
          href="/"
          className="btn-touch inline-flex rounded-xl bg-violet-600 px-6 font-semibold text-white hover:bg-violet-500"
        >
          {t.aboutBackTriage}
        </Link>
      </main>
      <AppFooter />
    </div>
  );
}
