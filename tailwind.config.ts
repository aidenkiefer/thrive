import type { Config } from 'tailwindcss'

/** Theme-aware color: the channels live in src/app/globals.css (:root for light, .dark for dark). */
const themed = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`

const config: Config = {
  darkMode: 'class',
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
          50: themed('brand-50'),
          100: themed('brand-100'),
          200: themed('brand-200'),
          300: themed('brand-300'),
          400: '#7097b3',
          500: '#4a7697',
          600: '#245a7a',
          700: '#1d4a6a',
          800: '#183d59',
          900: '#0f2838',
          950: '#0a1b27',
        },
        accent: {
          50: themed('accent-50'),
          100: themed('accent-100'),
          200: themed('accent-200'),
          300: '#dea3a8',
          400: '#c9828a',
          500: '#b4656f',
          600: '#984d58',
          700: '#7c3d47',
        },
        sky: {
          50: themed('sky-50'),
          100: themed('sky-100'),
          200: themed('sky-200'),
          300: '#94c5de',
          400: '#5fa5c9',
        },
        sand: {
          50: themed('sand-50'),
          100: themed('sand-100'),
          200: themed('sand-200'),
          300: '#dccdb3',
        },
        neutral: {
          0: themed('neutral-0'),
          50: themed('neutral-50'),
          100: themed('neutral-100'),
          200: themed('neutral-200'),
          300: themed('neutral-300'),
          400: themed('neutral-400'),
          500: themed('neutral-500'),
          600: themed('neutral-600'),
          700: themed('neutral-700'),
          800: themed('neutral-800'),
          900: themed('neutral-900'),
          950: themed('neutral-950'),
        },
        success: { 50: themed('success-50'), 600: '#2f7d5b', 700: themed('success-700') },
        warning: { 50: themed('warning-50'), 600: '#a8660f', 700: themed('warning-700') },
        danger: { 50: themed('danger-50'), 600: '#b3423d', 700: themed('danger-700') },
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
