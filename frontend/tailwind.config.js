/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        spartan: ['League Spartan', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
        xirod: ['Xirod', 'sans-serif'],
        arcade: ['ArcadeClassic', 'sans-serif'], 
      },
    },
  },
  plugins: [],
}