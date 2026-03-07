/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:           '#e00700',
        'background-dark': '#15151E',
        'card-dark':       '#1F1F2B',
        'surface-dark':    '#1E1E2E',
        'border-dark':     '#2d2d3d',
        'gold-accent':     '#F5D25D',
        'blue-accent':     '#6B9BF4',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
