/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bad5ff',
          300: '#8db9ff',
          400: '#588fff',
          500: '#3367ff',
          600: '#1d4cd8',
          700: '#173da9',
          800: '#173788',
          900: '#172f68'
        }
      },
      boxShadow: {
        soft: '0 8px 24px rgba(16, 42, 89, 0.08)'
      },
      borderRadius: {
        card: '12px'
      }
    }
  },
  plugins: []
};
