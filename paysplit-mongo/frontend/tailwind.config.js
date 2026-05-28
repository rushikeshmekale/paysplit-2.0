/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Cabinet Grotesk'", 'sans-serif'],
        body: ["'Manrope'", 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        glass: '0 8px 30px rgba(0,0,0,0.06)',
        purple: '0 4px 20px rgba(124,58,237,0.25)',
      },
    },
  },
  plugins: [],
}
