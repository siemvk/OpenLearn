import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './stories/**/*.{ts,tsx,js,jsx,mdx}',
    './.storybook/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        polar: {
          50: '#ebf8ff',
          100: '#d1f0ff',
          200: '#a5e1ff',
          300: '#77d2ff',
          400: '#4ec4ff',
          500: '#2eb6ff',
          600: '#1996e6',
          700: '#0e75b8',
          800: '#095a8d',
          900: '#084b74',
        },
        openlearn: {
          900: '#023824',
          800: '#0B4931',
          700: '#047047',
          600: '#147952',
          500: '#1CA971',
          400: '#1AC785',
          300: '#1AC785',
          200: '#66EDB9',
          100: '#8FF1CC',
          50: '#E6FCF3',
        }
      },
      boxShadow: {
        'elevated': '0 10px 20px rgba(37, 99, 235, 0.25), 0 6px 6px rgba(37, 99, 235, 0.20)'
      },
    },
  },
  plugins: [],
} satisfies Config
