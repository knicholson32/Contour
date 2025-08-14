// import { fontFamily } from "tailwindcss/defaultTheme";
const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
const config = {
	// darkMode: ["class"],
	content: ["./src/**/*.{html,js,svelte,ts}"],
  // safelist: ["dark"],
	theme: {
		// container: {
		// 	center: true,
		// 	padding: "2rem",
		// 	screens: {
		// 		"2xl": "1400px"
		// 	}
		// },
    // screens: {
    //   // 'xs': '475px',
		// 	// print: { raw: 'print' },
    //   ...defaultTheme.screens,
    // },
		extend: {
      screens: {
        'betterhover': { 'raw': '(hover: hover)' },
      },
      // fontSize: {
      //   xxs: [
      //     '0.6rem',
      //     {
      //       lineHeight: '1rem'
      //     }
      //   ]
      // },
      // blur: {
      //   '4xl': '128px'
      // },
      // dropShadow: {
      //   'xl-centered': '0 0px 25px rgba(0, 0, 0, 0.25)'
      // },
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
			backgroundImage: {
				// hashThickDark: 'repeating-linear-gradient(-45deg,transparent 0px,#000000 0.5px,#000000 4px,transparent 4.5px,transparent 8px)', 
				// hashThickLight: 'repeating-linear-gradient(-45deg,transparent 0px,#D4D4D7 0.5px,#D4D4D7 4px,transparent 4.5px,transparent 8px)', 
				// hashDark: 'repeating-linear-gradient(45deg,#3F3F45 0px,#3F3F45 1px,transparent 1px,transparent 6.83333px)',
				// hashLight: 'repeating-linear-gradient(45deg,#D4D4D7 0px,#D4D4D7 1px,transparent 1px,transparent 6.83333px)',
				// hashLight: 'url(data:image/png;base64,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)',
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
			// fontFamily: {
			// 	sans: [...defaultTheme.fontFamily.sans]
			// },
		}
	},
	// darkMode: null,
  plugins: [
		require('@tailwindcss/forms'),
		require('@tailwindcss/aspect-ratio'),
		// require('tailwindcss-animate'),
		// require('tailwindcss/plugin')(function ({ addVariant }) {
		// 	addVariant('dark', '@media not print { :is(:where(.dark) &) }')
		// }),
	]
};

export default config;
