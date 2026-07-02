import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./types/**/*.{js,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Detective noir palette
        noir: {
          50:  "#f5f3f0",
          100: "#e8e4de",
          200: "#d1c9be",
          300: "#b5a899",
          400: "#9a8877",
          500: "#856e5e",
          600: "#6e5a4e",
          700: "#584742",
          800: "#493b38",
          900: "#3e3231",
          950: "#211a19",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
        crimson: {
          500: "#dc143c",
          600: "#b91c1c",
          700: "#991b1b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "Menlo", "monospace"],
        detective: ["Georgia", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "typing": "typing 1.2s steps(3, end) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        typing: {
          "0%, 100%": { content: "''" },
          "33%": { content: "'.'" },
          "66%": { content: "'..'" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "noir-gradient": "linear-gradient(135deg, #211a19 0%, #3e3231 50%, #211a19 100%)",
      },
    },
  },
  plugins: [forms, typography],
};

export default config;
