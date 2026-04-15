import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

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
          75: '#d5f5e8',
          50: '#E6FCF3',
        },
        admin: {
          900: '#000000',
          800: '#2a2a2a',
          700: '#3f3f3f',
          600: '#747474',
          500: '#9c9c9c',
          400: '#a8a8a8',
          300: '#b7b7b7',
          200: '#dbeafe',
          100: '#eff6ff',
          75: '#f0f7ff',
          50: '#f8fafc',
        },
      },
      // boxShadow: {
      //   'elevated': '0 10px 20px rgba(37, 99, 235, 0.25), 0 6px 6px rgba(37, 99, 235, 0.20)'
      // },
    },
  },
  plugins: [
    plugin(({ addBase, theme }) => {
      const openlearn = theme('colors.openlearn') as Record<string, string>
      addBase({
        ':root': Object.fromEntries(
          Object.entries(openlearn).map(([key, value]) => [
            `--color-openlearn-${key}`,
            value,
          ])
        ),
      })
    }),
  ],
} satisfies Config
