import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0F172A",
        accent: "#7C3AED",
        "p3-emerald": "#10B981",
        "p2-amber": "#F59E0B",
        "p1-rose": "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-in": "slideIn 0.45s ease-out forwards",
        "pulse-ring": "pulseRing 1.5s ease-out infinite",
        blink: "blink 1.2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      boxShadow: {
        "glow-violet": "0 0 24px rgba(124, 58, 237, 0.45), 0 0 48px rgba(124, 58, 237, 0.2)",
        "glow-button": "0 0 20px rgba(124, 58, 237, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
