import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'media', // Enable dark mode based on system preference
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
