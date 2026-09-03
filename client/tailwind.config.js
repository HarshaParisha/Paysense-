/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0052ff",
          active: "#003ecc",
          disabled: "#a8b8cc",
        },
        surface: {
          canvas: "#ffffff",
          soft: "#f7f7f7",
          strong: "#eef0f3",
          dark: "#0a0b0d",
          darkElevated: "#16181c",
        },
        hairline: {
          DEFAULT: "#dee1e6",
          soft: "#eef0f3",
        },
        text: {
          ink: "#0a0b0d",
          body: "#5b616e",
          bodyStrong: "#0a0b0d",
          muted: "#7c828a",
          mutedSoft: "#a8acb3",
          onPrimary: "#ffffff",
          onDark: "#ffffff",
          onDarkSoft: "#a8acb3",
        },
        semantic: {
          up: "#05b169",
          down: "#cf202f",
        },
        status: {
          recoveredBg: "#E8F7F0",
          recoveredText: "#1A7A3C",
          pendingBg: "#EEF3FE",
          pendingText: "#0052ff",
          stoppedBg: "#F3F4F8",
          stoppedText: "#6B7494",
          escalatedBg: "#FFF5E6",
          escalatedText: "#A05C00",
        },
      },
      borderRadius: {
        pill: "100px",
        xl: "24px",
        lg: "16px",
        md: "12px",
        sm: "8px",
        xs: "4px",
      },
      fontFamily: {
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'system-ui', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      spacing: {
        section: "96px",
      },
    },
  },
  plugins: [],
};
