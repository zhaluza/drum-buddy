/** @type {import('tailwindcss').Config} */
export default {
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#6366f1", // Indigo-500
          dark: "#4f46e5", // Indigo-600
        },
        secondary: {
          light: "#f472b6", // Pink-400
          dark: "#ec4899", // Pink-500
        },
        background: {
          light: "#f3f4f6", // Gray-100
          dark: "#1f2937", // Gray-800
        },
        text: {
          light: "#1f2937", // Gray-800
          dark: "#f3f4f6", // Gray-100
        },
      },
    },
  },
  plugins: [],
};
