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
        deep: "#050A14",
        primary: "#6C63FF",
        brand: "#6C63FF",
        "accent-cyan": "#00D4FF",
        success: "#00E5A0",
        warning: "#FFB800",
        danger: "#FF4560",
        navy: "#050A14",
        accent: "#6C63FF",
        "p3-emerald": "#00E5A0",
        "p2-amber": "#FFB800",
        "p1-rose": "#FF4560",
        surface: {
          light: "#f8fafc",
          dark: "#050a14",
          card: "#ffffff",
          muted: "#f1f5f9",
        },
        text: {
          primary: "#0f172a",
          secondary: "#475569",
          muted: "#64748b",
        },
        border: {
          DEFAULT: "#e2e8f0",
          dark: "rgba(255,255,255,0.1)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "pulse-ring": "pulseRing 1.5s ease-out infinite",
        "spin-slow": "spin 3s linear infinite",
        "sound-bar": "soundBar 0.8s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        soundBar: {
          "0%": { height: "20%", opacity: "0.4" },
          "100%": { height: "100%", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
