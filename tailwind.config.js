/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['"Inter var"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 8px 30px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
