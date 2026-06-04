import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        background: {
          DEFAULT: "#0A0A0F",
          primary: "#0A0A0F",
          secondary: "#0F0F1A",
          card: "#13131F",
        },
        foreground: "#F0F0F0",
        accent: {
          primary: "#00D4B4",
          secondary: "#0099FF",
          glow: "rgba(0, 212, 180, 0.15)",
        },
        text: {
          primary: "#F0F0F0",
          secondary: "#8A8A9A",
          muted: "#4A4A5A",
        },
        danger: "#FF4444",
        success: "#00D4B4",
        warning: "#FFB800",
        border: "rgba(255, 255, 255, 0.08)",
      },
      boxShadow: {
        glow: "0 0 0 2px rgba(0, 212, 180, 0.3)",
        "accent-glow": "0 0 15px rgba(0, 212, 180, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
