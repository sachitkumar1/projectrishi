import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Project RISHI palette ---------------------------------
        // Grounded in the Himalayan foothills of Bharog Baneri:
        // terraced pine-green hills + warm Indian marigold + paper.
        paper: "#FBF8F1", // warm near-white page background
        ink: "#1B2620", // deep green-black for body text
        pine: {
          DEFAULT: "#1E4D3A", // primary brand green
          deep: "#143628",
          soft: "#2C5F49",
        },
        sage: "#5B7C6A", // muted secondary green
        marigold: {
          DEFAULT: "#E2A02F", // warm accent
          deep: "#C27E18",
          soft: "#F2C879",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1180px",
      },
      keyframes: {
        "draw-contour": {
          from: { strokeDashoffset: "1" },
          to: { strokeDashoffset: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
