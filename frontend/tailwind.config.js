/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        secondary: {
          DEFAULT: 'rgb(109, 76, 212)',
          hover: 'rgb(89, 56, 192)',
        }
      }
    },
  },
  plugins: [],
}