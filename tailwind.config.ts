import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    screens: {
      xs: "390px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px"
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"]
      },
      colors: {
        canvas: "#fafafa",
        ink: "#09090b",
        accent: "#1447e6",
        leaf: "#1a4eda",
        sky: "#f4f4f5"
      },
      boxShadow: {
        card: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        soft: "0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)"
      }
    }
  },
  plugins: []
};

export default config;
