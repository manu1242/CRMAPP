/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          bg: 'var(--color-primary-bg)',
          text: 'var(--color-text-primary)',
        },
        secondary: {
          bg: 'var(--color-secondary-bg)',
          text: 'var(--color-text-secondary)',
        },
        brand: {
          DEFAULT: 'var(--color-brand)',
          hover: 'var(--color-brand-hover)',
        },
        accent: 'var(--color-accent)',
        muted: 'var(--color-text-muted)',
      },
      borderRadius: {
        custom: '10px', // Strict 10px rounded max as requested
      },
      boxShadow: {
        custom: 'var(--shadow-custom)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
        rounded: ['var(--font-rounded)'],
        serif: ['var(--font-serif)'],
      }
    },
  },
  plugins: [],
}
