/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'hsl(220, 100%, 68%)',
        secondary: 'hsl(31, 92%, 62%)',
        dark: 'hsl(220, 17%, 17%)',
        'dark-cloud': 'hsl(220, 17%, 30%)',
        'dark-paper': 'hsl(220, 17%, 12%)',
        'white-cloud': 'hsl(240, 1%, 92%)',
        gray: 'hsl(220, 17%, 57%)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen-Sans',
          'Ubuntu',
          'Cantarell',
          'Helvetica Neue',
          'sans-serif'
        ],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: theme('colors.dark'),
            a: {
              color: theme('colors.primary'),
              textDecoration: 'none',
              '&:hover': {
                color: theme('colors.secondary'),
              },
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            code: {
              backgroundColor: theme('colors.white-cloud'),
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
            },
            blockquote: {
              borderLeftColor: theme('colors.primary'),
              fontStyle: 'normal',
            },
            h1: {
              fontWeight: '600',
            },
            h2: {
              fontWeight: '600',
            },
            h3: {
              fontWeight: '600',
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.white'),
            a: {
              color: theme('colors.primary'),
              '&:hover': {
                color: theme('colors.secondary'),
              },
            },
            strong: {
              color: theme('colors.white'),
            },
            'h1, h2, h3, h4, h5, h6': {
              color: theme('colors.white'),
            },
            code: {
              backgroundColor: 'hsl(220, 17%, 22%)',
              color: '#e5e7eb',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
            },
            blockquote: {
              color: theme('colors.gray'),
              borderLeftColor: theme('colors.primary'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
