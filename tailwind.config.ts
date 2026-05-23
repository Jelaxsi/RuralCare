import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0F172A",
        brand: "#1e3a5f",
        "brand-dark": "#152a45",
        "brand-violet": "#7C3AED",
        accent: "#7C3AED",
        "p3-emerald": "#10B981",
        "p2-amber": "#F59E0B",
        "p1-rose": "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        24: "6rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-in": "slideIn 0.4s ease-out forwards",
        "pulse-ring": "pulseRing 1.5s ease-out infinite",
        blink: "blink 1.2s ease-in-out infinite",
        "sound-bar": "soundBar 0.8s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
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
        soundBar: {
          "0%": { height: "20%", opacity: "0.5" },
          "100%": { height: "100%", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
