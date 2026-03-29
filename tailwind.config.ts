import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        bento: {
          border: "rgb(226 232 240 / 0.9)",
          muted: "rgb(248 250 252)",
          accent: "rgb(14 116 144)",
          accentSoft: "rgb(207 250 254)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
