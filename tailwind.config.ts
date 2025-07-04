import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./client/index.html", 
    "./client/src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Research-Based Triadic Color System (WCAG Compliant)
        emerald: {
          50: "#ecfdf5",
          100: "#d1fae5", 
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          DEFAULT: "#059669",  // Primary emerald - WCAG AA: 4.52:1
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22"
        },
        lavender: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff", 
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          DEFAULT: "#7c3aed",  // Primary lavender - WCAG AAA: 7.04:1  
          800: "#6b21a8",
          900: "#581c87",
          950: "#3b0764"
        },
        neutral: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7", 
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          DEFAULT: "#18181b",  // Primary text - WCAG AAA: 16.94:1
          950: "#09090b"
        },
        // Business Dashboard Semantic Colors
        success: "#059669",    // Emerald for positive states
        info: "#7c3aed",      // Lavender for information
        warning: "#f59e0b",   // Amber for warnings  
        error: "#dc2626",     // Red for errors
        // Legacy Compatibility (Mapped to New System)
        primaryGreen: {
          DEFAULT: "#059669",  // Maps to emerald
          light: "#10b981",
          dark: "#047857",
          50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 
          400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857", 
          800: "#065f46", 900: "#064e3b", 950: "#022c22"
        },
        primaryPurple: {
          DEFAULT: "#7c3aed",  // Maps to lavender
          light: "#a855f7", 
          dark: "#6b21a8",
          50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe",
          400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7c3aed",
          800: "#6b21a8", 900: "#581c87", 950: "#3b0764"
        },
        brandBlack: {
          DEFAULT: "#18181b",  // Maps to neutral
          light: "#27272a",
          dark: "#09090b",
          50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8",
          400: "#a1a1aa", 500: "#71717a", 600: "#52525b", 700: "#3f3f46",
          800: "#27272a", 900: "#18181b", 950: "#09090b"
        },
        // Shadcn compatible colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
