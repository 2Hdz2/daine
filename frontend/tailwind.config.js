/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: "#355E3B",
        sage: "#B7D7B0",
        mist: "#F0F7EE",
      },
    },
  },
  plugins: [],
}
