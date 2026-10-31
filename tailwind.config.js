/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./types/**/*.{ts,tsx}",
  ],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      colors: {
        background: "#F8FAFC",
        surface: "#FFFFFF",
        "surface-muted": "#F1F5F9",
        "text-main": "#0F172A",
        "text-muted": "#64748B",
        primary: "#2563EB",
        success: "#16A34A",
        warning: "#EA580C",
        "warning-foreground": "#7C2D12",
        destructive: "#DC2626",
        border: "#E2E8F0",
        input: "#E2E8F0",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.10)",
      },
    },
  },
  plugins: [],
};
