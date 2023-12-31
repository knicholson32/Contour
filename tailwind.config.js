const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    screens: {
      'xs': '475px',
      ...defaultTheme.screens,
    },
    extend: {
      screens: {
        'betterhover': { 'raw': '(hover: hover)' },
      },
      fontSize: {
        xxs: [
          '0.6rem',
          {
            lineHeight: '1rem'
          }
        ]
      },
      blur: {
        '4xl': '128px'
      },
      dropShadow: {
        'xl-centered': '0 0px 25px rgba(0, 0, 0, 0.25)'
      },
      gridTemplateColumns: {
        30: 'repeat(30, minmax(0, 1fr))'
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' }
        }
      },
      animation: {
        'marquee-infinite': 'marquee 10s linear infinite'
      },
      transitionProperty: {
        width: 'width',
        padding: 'padding',
        'width-padding': 'width, padding'
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/aspect-ratio')]
}

