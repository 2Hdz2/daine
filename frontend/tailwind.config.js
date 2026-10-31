/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: "#487935",
        sage: "#71d871",
        mist: "#FFFFFF",
        lime: "#71d871",
        ink: "#000000",
      },
    },
  },
  plugins: [],
}
