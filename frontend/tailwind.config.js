/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          base: "rgb(var(--bg-base) / <alpha-value>)",
          surface: "rgb(var(--bg-surface) / <alpha-value>)",
          elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
          border: "rgb(var(--bg-border) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          subtle: "rgb(var(--ink-subtle) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
        },
        cyan: { soft: "rgb(var(--cyan-soft) / <alpha-value>)" },
        violet: { soft: "rgb(var(--violet-soft) / <alpha-value>)" },
        rag: {
          green: "#10B981",
          amber: "#F59E0B",
          red: "#EF4444",
        },
      },
      fontFamily: {
        sans: ['"Manrope"', '"Segoe UI"', "system-ui", "sans-serif"],
        display: ['"Cormorant Garamond"', '"Georgia"', "serif"],
        numeric: ['"Sora"', '"Manrope"', '"Segoe UI"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 16px 24px -20px rgb(var(--accent) / 0.7)",
        card: "var(--shadow-card)",
      },
      backgroundImage: {
        aurora: "var(--aurora)",
        card: "linear-gradient(180deg, rgb(var(--bg-surface) / 0.03), rgb(var(--bg-surface) / 0))",
      },
      animation: {
        "pulse-glow": "pulseGlow 2.4s ease-in-out infinite",
        "fade-up": "fadeUp 0.5s ease-out both",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.5)" },
          "50%": { boxShadow: "0 0 0 10px rgba(239,68,68,0)" },
        },
        fadeUp: {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
