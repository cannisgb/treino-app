import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: "#111315",
        surface: "#1A1D21",
        raised: "#15181B",
        line: "#2A2E33",
        chalk: "#EDEBE6",
        muted: "#A3A9AF",
        lime: "#C6F432",
        "lime-soft": "#E2FF8A",
        warn: "#FF8A57",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
