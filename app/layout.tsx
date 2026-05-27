import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppFooter } from "@/components/AppFooter";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RuralCare — Emergency Health Triage",
  description:
    "AI-powered emergency health triage for rural South Asia. Speak symptoms in Tamil, Sinhala, Hindi and 8 more languages. Instant P1/P2/P3 urgency scoring.",
  keywords:
    "emergency triage, rural healthcare, Tamil, Sinhala, AI medical, Sri Lanka, South Asia",
  manifest: "/manifest.json",
  openGraph: {
    title: "RuralCare — Emergency Health Triage",
    description: "Speak your symptoms. AI assesses urgency in 11 languages.",
    url: "https://rural-care-swart.vercel.app",
    siteName: "RuralCare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RuralCare — Emergency Health Triage",
    description: "AI triage in 11 South Asian languages",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RuralCare",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ruralcare-theme');document.documentElement.classList.toggle('dark',t!=='light');}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans text-base bg-deep`}>
        <ThemeProvider>
          <OfflineBanner />
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
