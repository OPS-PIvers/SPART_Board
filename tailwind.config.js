/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './components/**/*.{js,ts,jsx,tsx}',
    './context/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './*.{js,ts,jsx,tsx}',
    './config/tools.ts',
  ],
  safelist: [
    'bg-blue-500',
    'bg-red-500',
    'bg-amber-500',
    'bg-yellow-400',
    'bg-green-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-slate-700',
    'bg-sky-600',
    'bg-orange-500',
    'bg-gray-800',
    'bg-yellow-600',
    'bg-emerald-600',
    'bg-sky-400',
    'bg-teal-600',
    'bg-rose-500',
    'bg-orange-600',
    'bg-indigo-600',
    'bg-[#2d3f89]',
    'bg-violet-600',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Lexend"', 'sans-serif'],
        handwritten: ['"Patrick Hand"', 'cursive'],
        mono: ['"Roboto Mono"', 'monospace'],
      },
      colors: {
        brand: {
          blue: {
            primary: '#2d3f89',
            dark: '#1d2a5d',
            light: '#4356a0',
            lighter: '#eaecf5',
          },
          red: {
            primary: '#ad2122',
            dark: '#7a1718',
            light: '#c13435',
            lighter: '#e5c7c7',
          },
          gray: {
            darkest: '#1a1a1a',
            dark: '#333333',
            primary: '#666666',
            light: '#999999',
            lighter: '#cccccc',
            lightest: '#f3f3f3',
          },
        },
      },
      animation: {
        'spin-slow': 'spin-slow 12s linear infinite',
      },
      keyframes: {
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};
