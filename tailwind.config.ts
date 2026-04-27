import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0D1B3E",
          800: "#132347",
          750: "#1A2B52",
          700: "#233160",
          600: "#2D3E73",
        },
        brand: {
          blue: "#2B5CC8",
          "blue-mid": "#4A7FD4",
          "blue-dark": "#1E4BAF",
          cyan: "#7DD3F0",
          coral: "#F47B5A",
          green: "#10B981",
          amber: "#F59E0B",
          red: "#EF4444",
        },
        surface: "#F7F8FC",
        "mid-gray": "#6B7A99",
        "border-gray": "#DDDDDD",
        glass: "rgba(255,255,255,0.04)",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Barlow Condensed", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.15s ease-out",
        "slide-in": "slideIn 0.2s ease-out",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "shimmer": "shimmer 2.5s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
