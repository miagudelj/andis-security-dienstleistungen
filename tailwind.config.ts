import type { Config } from 'tailwindcss'

// Farbpalette: blau / weiss / schwarz / grau (analog presolutions.ch)
export default <Partial<Config>>{
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './nuxt.config.ts',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f5fb',
          100: '#dde8f4',
          200: '#bcd1ea',
          300: '#8fb2dc',
          400: '#5d8cc9',
          500: '#3a6db4',
          600: '#2a5697', // Primärblau
          700: '#23457a',
          800: '#1f3b65',
          900: '#1d3357',
          950: '#13213a',
        },
        ink: {
          50:  '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae2',
          300: '#b0b9c8',
          400: '#8592a8',
          500: '#65728c',
          600: '#505b73',
          700: '#414a5e',
          800: '#383f4f',
          900: '#1a1f2c',
          950: '#0d1018',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      container: {
        center: true,
        padding: { DEFAULT: '1rem', md: '1.5rem', lg: '2rem' },
      },
    },
  },
  plugins: [],
}
