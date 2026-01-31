import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Gowun Batang", "serif"],
        display: ["Great Vibes", "cursive"],
      },
      colors: {
        wedding: {
          cream: "#FFF8F0",
          gold: "#D4A574",
          rose: "#E8B4B8",
          deep: "#2C1810",
          blush: "#F5E6E0",
        },
      },
    },
  },
  plugins: [],
};
export default config;
