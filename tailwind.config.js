/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium Dark Theme Palette
        background: '#0a0a0a',
        surface: '#1a1a1a',
        primary: '#e11d48', // Rose-600 (Vampire Red)
        secondary: '#2563eb', // Blue-600 (Villager Blue)
        accent: '#f59e0b', // Amber-500 (Sheriff Gold)
        muted: '#737373',
        text: '#e5e5e5',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'], // For that gothic vampire feel
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
