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
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)'
        },
        secondary: 'var(--color-secondary)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          1: 'var(--color-accent-1)'
        },
        surface: 'var(--color-surface)',
        glass: 'rgba(255,255,255,0.06)'
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px'
      },
      boxShadow: {
        'soft-sm': '0 6px 18px rgba(16,24,40,0.06)',
        'soft-md': '0 12px 30px rgba(2,6,23,0.12)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue']
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
          '100%': { transform: 'translateY(0px)' }
        }
      },
      animation: {
        float: 'float 6s ease-in-out infinite'
      }
    },
  },
  plugins: [],
}