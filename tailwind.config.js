/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50:  '#fff7f3',
          100: '#ffe8db',
          200: '#ffcbb0',
          300: '#ffa47a',
          400: '#ff7847',
          500: '#FF6B35',
          600: '#e85420',
          700: '#c43f15',
          800: '#9e3316',
          900: '#7f2d17',
        },
        peacock: {
          50:  '#f0faf5',
          100: '#d3f0e2',
          200: '#a9e0c7',
          300: '#72c9a5',
          400: '#3aae82',
          500: '#1A936F',
          600: '#12785a',
          700: '#106049',
          800: '#0f4d3b',
          900: '#0d3f31',
        },
        cream: '#FDF8F0',
      },
      fontFamily: {
        devanagari: ['Noto Sans Devanagari', 'sans-serif'],
      },
      keyframes: {
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out both',
      },
    },
  },
  plugins: [],
}
