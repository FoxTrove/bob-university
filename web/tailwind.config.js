/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C68976',
        background: '#0a0a0a',
        surface: '#1a1a1a',
        // Light theme
        'light-bg': '#f7f3ef',
        'light-surface': '#ffffff',
        'light-text': '#1a1a1a',
        'light-muted': '#6b6b6b',
        'light-border': '#e5e0db',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
