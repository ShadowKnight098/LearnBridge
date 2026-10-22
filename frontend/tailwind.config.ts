import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        student: {
          primary: "#6C4DF6",
          hover: "#593ADB",
          success: "#2BB673",
          warning: "#FFB020",
          softError: "#FF6B6B",
          bg: "#F6F3FF",
          text: "#1E1B3A",
          card: "#FFFFFF",
        },
        portal: {
          primary: "#2F5BEA",
          hover: "#1D44C9",
          success: "#1F9D61",
          warning: "#E69A00",
          danger: "#D64545",
          bg: "#F7F8FA",
          text: "#1A1F2B",
          border: "#E2E8F0",
        },
      },
      borderRadius: {
        studentBtn: "20px",
        studentCard: "24px",
      },
      minHeight: {
        touchStudent: "56px",
        touchPortal: "40px",
      },
      minWidth: {
        touchStudent: "56px",
        touchPortal: "40px",
      },
    },
  },
  plugins: [],
};

export default config;
