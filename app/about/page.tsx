import Link from "next/link";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-deep">
      <AppHeader showAbout={false} />
      <main className="mx-auto max-w-3xl px-4 pb-10 pt-[calc(64px+32px)]">
        <h1 className="hero-title mb-2 text-left">About RuralCare</h1>
        <p className="mb-8 text-white/55">
          Bringing AI-powered emergency triage to rural communities across South Asia.
        </p>

        <section className="result-card-premium mb-4 !mx-0">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-violet-400">Mission</h2>
          <p className="text-sm leading-relaxed text-white/65">
            RuralCare helps patients and health workers quickly assess symptoms, prioritize care, and
            find nearby facilities — in local languages, on low-bandwidth devices.
          </p>
        </section>

        <section className="result-card-premium mb-4 !mx-0">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-violet-400">How it works</h2>
          <ol className="space-y-3 text-sm text-white/65">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 font-bold text-violet-300">1</span>
              <span><strong className="text-white/80">Speak</strong> — describe symptoms in Tamil, Sinhala, Hindi, English, or 10+ languages.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 font-bold text-violet-300">2</span>
              <span><strong className="text-white/80">AI analyzes</strong> — Groq AI assesses priority (P1/P2/P3) with clinical guidance.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 font-bold text-violet-300">3</span>
              <span><strong className="text-white/80">Get results</strong> — hear results aloud, find hospitals via OpenStreetMap, save cases.</span>
            </li>
          </ol>
        </section>

        <section className="result-card-premium mb-4 !mx-0">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-violet-400">Built with</h2>
          <p className="text-sm text-white/65">Next.js · Groq AI · OpenAI TTS · Valsea STT · OpenStreetMap · Vercel</p>
        </section>

        <section className="result-card-premium mb-4 !mx-0">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-violet-400">Team</h2>
          <ul className="space-y-1 text-sm text-white/65">
            <li>RuralCare Engineering Team</li>
            <li>Clinical Advisors — Rural Health Network</li>
            <li>Community Partners — Sri Lanka & India</li>
          </ul>
        </section>

        <section className="result-card-premium mb-8 !mx-0">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-violet-400">Contact</h2>
          <p className="text-sm text-white/65">
            <a href="https://github.com" className="text-violet-400 underline" target="_blank" rel="noreferrer">
              GitHub
            </a>
            {" · "}
            <Link href="/" className="text-violet-400 underline">Start triage</Link>
          </p>
        </section>

        <Link href="/" className="btn-touch inline-flex rounded-xl bg-violet-600 px-6 font-semibold text-white hover:bg-violet-500">
          ← Back to Triage
        </Link>
      </main>
      <AppFooter />
    </div>
  );
}
