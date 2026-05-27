import Link from "next/link";

type Props = {
  text?: string;
};

export function AppFooter({
  text = "RuralCare © 2026 | Not a medical device | Built for rural healthcare",
}: Props) {
  return (
    <footer className="no-print mx-auto max-w-3xl px-4 py-8 text-center">
      <p className="text-xs leading-relaxed text-gray-400 dark:text-white/35">{text}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
        <Link href="/about" className="text-gray-500 transition hover:text-gray-800 dark:text-white/45 dark:hover:text-white/70">
          About
        </Link>
        <Link href="/qr" className="text-gray-500 transition hover:text-gray-800 dark:text-white/45 dark:hover:text-white/70">
          QR Code
        </Link>
        <Link href="/dashboard" className="text-gray-500 transition hover:text-gray-800 dark:text-white/45 dark:hover:text-white/70">
          Dashboard
        </Link>
      </div>
    </footer>
  );
}
