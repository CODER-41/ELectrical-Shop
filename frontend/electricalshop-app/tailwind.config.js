/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F97316',
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        secondary: {
          DEFAULT: '#FBBF24',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [
    function({ addComponents }) {
      addComponents({
        '.card': {
          '@apply bg-white rounded-lg shadow-card border border-gray-200': {},
        },
        '.btn': {
          '@apply px-4 py-2 rounded-md font-medium transition-colors duration-200': {},
        },
        '.btn-primary': {
          '@apply bg-primary text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2': {},
        },
        '.btn-outline': {
          '@apply border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2': {},
        },
        '.input': {
          '@apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent': {},
        },
        '.form-label': {
          '@apply block text-sm font-medium text-gray-700 mb-1': {},
        },
      });
    },
  ],
}
