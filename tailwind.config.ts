import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ============================================================
        // Dynamic brand colors — อ่านจาก CSS variables ที่ SettingsProvider
        // ตั้งค่าให้ (มาจาก site_settings ใน DB)
        //
        // ใช้รูปแบบ rgb(var(--*-rgb) / <alpha-value>) เพื่อรองรับ
        // opacity modifier ของ Tailwind (เช่น text-brand-primary/70)
        // → --color-*-rgb เก็บค่าเป็น channel triplet "251 191 36"
        // ============================================================
        brand: {
          // พื้นผิว — รองรับ opacity modifier ผ่าน rgb channel variables
          // (เช่น bg-brand-bg/90) เพราะ --color-*-rgb เก็บ "r g b"
          DEFAULT: "rgb(var(--color-bg-rgb) / <alpha-value>)",
          bg: "rgb(var(--color-bg-rgb) / <alpha-value>)",
          "bg-secondary": "rgb(var(--color-bg-secondary-rgb) / <alpha-value>)",
          card: "rgb(var(--color-card-rgb) / <alpha-value>)",
          header: "rgb(var(--color-header-rgb) / <alpha-value>)",
          sidebar: "rgb(var(--color-sidebar-rgb) / <alpha-value>)",

          // border เก็บค่าเป็น rgba อยู่แล้ว — ใช้ตรงๆ (ไม่รองรับ /opacity)
          "card-border": "var(--color-card-border)",

          // text ใช้ hex ตรงๆ (ไม่รองรับ /opacity)
          text: "var(--color-text)",
          "text-muted": "var(--color-text-muted)",

          // สีเน้น — รองรับ opacity (เช่น bg-brand-primary/15)
          primary: "rgb(var(--color-primary-rgb) / <alpha-value>)",
          secondary: "rgb(var(--color-secondary-rgb) / <alpha-value>)",
          accent: "rgb(var(--color-accent-rgb) / <alpha-value>)",
          success: "rgb(var(--color-success-rgb) / <alpha-value>)",
          error: "rgb(var(--color-error-rgb) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        serif: ["var(--font-noto-serif)", "Georgia", "serif"],
        heading: ["var(--font-playfair)", "Georgia", "Times New Roman", "serif"],
        thai: ["var(--font-noto-sans-thai)", "Noto Sans Thai", "sans-serif"],
        prompt: ["var(--font-prompt)", "Prompt", "sans-serif"],
        kanit: ["var(--font-kanit)", "Kanit", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

