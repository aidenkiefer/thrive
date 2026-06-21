import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.mdx',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#0f2838',
          800: '#183d59',
          600: '#245a7a',
          100: '#e8eef2',
        },
        accent: {
          400: '#c8cc9a',
          50: '#f4f5eb',
        },
        neutral: {
          950: '#1a1a1a',
          600: '#5c5c5c',
          100: '#f7f7f5',
          0: '#ffffff',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [],
}

export default config
