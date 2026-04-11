/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          DEFAULT: '#0D1B2A',
          50: '#1a2e42',
          100: '#162538',
          200: '#112030',
          300: '#0D1B2A',
          400: '#091422',
          500: '#060e18',
        },
        electric: {
          DEFAULT: '#3A86FF',
          50: '#e8f2ff',
          100: '#c4daff',
          200: '#8db8ff',
          300: '#5c9aff',
          400: '#3A86FF',
          500: '#1a6fe0',
          600: '#1258b8',
        },
        cyan: {
          DEFAULT: '#00B4D8',
          50: '#e0f8fd',
          100: '#b3eef9',
          200: '#66d9f0',
          300: '#1ac8e9',
          400: '#00B4D8',
          500: '#0093b2',
          600: '#007490',
        },
        neon: {
          DEFAULT: '#80FFDB',
          50: '#f0fffb',
          100: '#c8fff3',
          200: '#a0ffe9',
          300: '#80FFDB',
          400: '#50f5cc',
          500: '#20e0b0',
        },
        light: {
          DEFAULT: '#E0E1DD',
          50: '#ffffff',
          100: '#f5f5f3',
          200: '#ebebea',
          300: '#E0E1DD',
          400: '#c8c9c4',
          500: '#b0b1ac',
        },
      },
    },
  },
  plugins: [],
};
