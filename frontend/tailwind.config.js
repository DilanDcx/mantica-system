/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          DEFAULT: 'var(--bg-app)',
          card: 'var(--bg-card)',
          'card-hover': 'var(--bg-card-hover)',
          subtle: 'var(--bg-subtle)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          text: 'var(--primary-text)',
        },
        content: {
          main: 'var(--text-main)',
          body: 'var(--text-body)',
          muted: 'var(--text-muted)',
        },
        stroke: {
          DEFAULT: 'var(--border)',
          focus: 'var(--border-focus)',
        },
      },
    },
  },
  plugins: [],
}