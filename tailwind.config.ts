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
      // Palette reference and usage rules: docs/07-design-system.md ("Brand palette").
      colors: {
        brand: {
          50: '#f3f7fa',
          100: '#e8eef2',
          200: '#cddbe6',
          300: '#a3bdd0',
          400: '#7097b3',
          500: '#4a7697',
          600: '#245a7a',
          700: '#1d4a6a',
          800: '#183d59',
          900: '#0f2838',
          950: '#0a1b27',
        },
        accent: {
          50: '#fbf1f0',
          100: '#f6e2e1',
          200: '#edc6c7',
          300: '#dea3a8',
          400: '#c9828a',
          500: '#b4656f',
          600: '#984d58',
          700: '#7c3d47',
        },
        sky: {
          50: '#f2f8fb',
          100: '#e1eff6',
          200: '#c3dfed',
          300: '#94c5de',
          400: '#5fa5c9',
        },
        sand: {
          50: '#fcfaf6',
          100: '#f6f1e8',
          200: '#ece3d3',
          300: '#dccdb3',
        },
        neutral: {
          0: '#ffffff',
          50: '#fbfbfa',
          100: '#f7f7f5',
          200: '#ecebe7',
          300: '#dad8d2',
          400: '#a9a69e',
          500: '#7b7972',
          600: '#5c5c5c',
          700: '#45443f',
          800: '#2d2c29',
          900: '#21201e',
          950: '#1a1a1a',
        },
        success: { 50: '#eef7f2', 600: '#2f7d5b', 700: '#256649' },
        warning: { 50: '#fdf6e9', 600: '#a8660f', 700: '#8a530c' },
        danger: { 50: '#fcefee', 600: '#b3423d', 700: '#933530' },
      },
      boxShadow: {
        soft: '0 1px 2px rgb(15 40 56 / 0.04), 0 4px 16px -4px rgb(15 40 56 / 0.08)',
        lift: '0 2px 4px rgb(15 40 56 / 0.04), 0 16px 32px -12px rgb(15 40 56 / 0.18)',
      },
      borderRadius: {
        '4xl': '2rem',
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
