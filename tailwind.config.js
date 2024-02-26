// import { fontFamily } from "tailwindcss/defaultTheme";
const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
const config = {
	// darkMode: ["class"],
	content: ["./src/**/*.{html,js,svelte,ts}"],
  safelist: ["dark"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px"
			}
		},
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
      },
			colors: {
				border: "hsl(var(--border) / <alpha-value>)",
				input: "hsl(var(--input) / <alpha-value>)",
				ring: "hsl(var(--ring) / <alpha-value>)",
				background: "hsl(var(--background) / <alpha-value>)",
				foreground: "hsl(var(--foreground) / <alpha-value>)",
				primary: {
					DEFAULT: "hsl(var(--primary) / <alpha-value>)",
					foreground: "hsl(var(--primary-foreground) / <alpha-value>)"
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
					foreground: "hsl(var(--secondary-foreground) / <alpha-value>)"
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
					foreground: "hsl(var(--destructive-foreground) / <alpha-value>)"
				},
				muted: {
					DEFAULT: "hsl(var(--muted) / <alpha-value>)",
					foreground: "hsl(var(--muted-foreground) / <alpha-value>)"
				},
				accent: {
					DEFAULT: "hsl(var(--accent) / <alpha-value>)",
					foreground: "hsl(var(--accent-foreground) / <alpha-value>)"
				},
				popover: {
					DEFAULT: "hsl(var(--popover) / <alpha-value>)",
					foreground: "hsl(var(--popover-foreground) / <alpha-value>)"
				},
				card: {
					DEFAULT: "hsl(var(--card) / <alpha-value>)",
					foreground: "hsl(var(--card-foreground) / <alpha-value>)"
				}
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)"
			},
			fontFamily: {
				sans: [...defaultTheme.fontFamily.sans]
			}
		}
	},
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/aspect-ratio')]
};

export default config;
