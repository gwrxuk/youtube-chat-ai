import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#0a0a0f",
          1: "#12121a",
          2: "#1a1a26",
          3: "#242433",
          4: "#2e2e40",
        },
        accent: {
          DEFAULT: "#7c5cfc",
          light: "#a78bfa",
          dim: "#5b3fd4",
        },
        chat: {
          user: "#7c5cfc",
          ai: "#22c55e",
        },
      },
    },
  },
  plugins: [],
};
export default config;
