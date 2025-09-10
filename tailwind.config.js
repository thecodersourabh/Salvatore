/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      keyframes: {
        loading: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        }
      },
      animation: {
        'loading': 'loading 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        'safe': 'env(safe-area-inset-top)',
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      colors: {
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.pt-safe': {
          paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        },
        '.pb-safe': {
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        },
        '.pl-safe': {
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        },
        '.pr-safe': {
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        },
      }
      addUtilities(newUtilities)
    }
  ],
};
