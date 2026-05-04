import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        saffron: "#f4a62a",
        basil: "#2f7d5c",
        tomato: "#d94f3d",
        rice: "#fbfaf7"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(31, 41, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
