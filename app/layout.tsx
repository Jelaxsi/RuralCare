import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { hospitalConfig } from "@/lib/hospital/config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${hospitalConfig.name} — RuralCare Triage`,
  description: "Production-grade emergency health triage for rural healthcare networks across South Asia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`:root { --brand: ${hospitalConfig.primaryColor}; --brand-dark: ${hospitalConfig.primaryColor}; }`}</style>
      </head>
      <body className={`${inter.variable} font-sans text-base`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
