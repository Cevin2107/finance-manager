import type { Config } from "tailwindcss";

const config: Config = {
  // Use class strategy so we can toggle dark mode manually via a 'dark' class on <html>
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
