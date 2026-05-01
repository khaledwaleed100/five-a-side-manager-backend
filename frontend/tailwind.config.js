/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pitch: {
          light: '#16a34a', // green-600
          dark: '#10b981',  // emerald-500
        },
        accent: {
          light: '#dc2626', // red-600
          dark: '#f43f5e',  // rose-500
        },
        surface: {
          light: '#f9fafb', // gray-50
          dark: '#0f172a',  // slate-900
        }
      }
    },
  },
  plugins: [],
}
