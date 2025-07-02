/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E54C37',
        'primary-dark': '#C23D2E',
        'primary-light': '#F1705A',

        background: '#FDF9F8',
        surface: '#FFFFFF',

        'text-primary': '#1A1A1A',
        'text-muted': '#6B6B6B',

        border: '#EAEAEA',

        success: '#22C55E',
        error: '#EF4444',
        info: '#3B82F6',
      },
    },
  },
  plugins: [],
};


