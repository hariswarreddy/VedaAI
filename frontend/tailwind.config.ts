import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff5ef",
          100: "#ffe6d5",
          200: "#ffc6a3",
          300: "#ffa170",
          400: "#fb813f",
          500: "#f26b3a",
          600: "#e2541d",
          700: "#bb4015",
          800: "#943316",
          900: "#762c16",
        },
        ink: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#d8d8dc",
          300: "#b3b4bb",
          400: "#86878f",
          500: "#5f6068",
          600: "#42434a",
          700: "#2f3036",
          800: "#1d1e22",
          900: "#0e0f12",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 17, 21, 0.04), 0 0 0 1px rgba(15, 17, 21, 0.04)",
        soft: "0 4px 14px rgba(15, 17, 21, 0.06)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        serif: ["Georgia", "ui-serif", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
