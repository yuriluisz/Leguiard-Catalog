import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#ffffff",
        ink: "#0a0a0a",
        accent: "#1447e6",
        leaf: "#1a4eda",
        sky: "#f5f5f5"
      },
      boxShadow: {
        card: "0 1px 3px 0 hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
