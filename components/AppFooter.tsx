import Link from "next/link";

type Props = {
  text?: string;
};

export function AppFooter({
  text = "RuralCare © 2026 | Not a medical device | Built for rural healthcare",
}: Props) {
  return (
    <footer className="mx-auto max-w-3xl px-4 py-8 text-center">
      <p className="text-xs leading-relaxed text-theme-subtle">{text}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
        <Link href="/about" className="text-theme-muted transition hover:text-theme-body">
          About
        </Link>
        <Link href="/qr" className="text-theme-muted transition hover:text-theme-body">
          QR Code
        </Link>
        <Link href="/dashboard" className="text-theme-muted transition hover:text-theme-body">
          Dashboard
        </Link>
      </div>
    </footer>
  );
}
