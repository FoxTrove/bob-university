/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        surfaceHighlight: 'rgb(var(--color-surface-highlight) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        primaryDark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        textMuted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        
        // Brand aliases for backward compatibility
        brand: {
          surface: 'rgb(var(--color-surface) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          primary: 'rgb(var(--color-text) / <alpha-value>)', 
          accent: 'rgb(var(--color-accent) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
        },

        // Tier specific colors
        tier: {
          free: 'rgb(var(--color-tier-free) / <alpha-value>)',
          individual: 'rgb(var(--color-tier-individual) / <alpha-value>)',
          salon: 'rgb(var(--color-tier-salon) / <alpha-value>)',
          gold: 'rgb(var(--color-tier-gold) / <alpha-value>)',
        },

        // Bob University brand colors
        bu: {
          navy: 'rgb(var(--color-bu-navy) / <alpha-value>)',
          gold: 'rgb(var(--color-bu-gold) / <alpha-value>)',
          cream: 'rgb(var(--color-bu-cream) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['DMSans_400Regular', 'sans-serif'],
        bold: ['DMSans_700Bold', 'sans-serif'],
        medium: ['DMSans_500Medium', 'sans-serif'],
        serif: ['PlayfairDisplay_400Regular', 'serif'],
        serifBold: ['PlayfairDisplay_700Bold', 'serif'],
      }
    },
  },
  plugins: [],
}
