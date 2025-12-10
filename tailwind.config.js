/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Placeholder brand colors - update when client provides final palette
        brand: {
          primary: '#000000',      // Main CTA, headers
          secondary: '#374151',    // Secondary text
          accent: '#3B82F6',       // Links, highlights
          muted: '#9CA3AF',        // Subtle text
          background: '#FFFFFF',   // App background
          surface: '#F9FAFB',      // Card backgrounds
          border: '#E5E7EB',       // Borders, dividers
        },
        // Subscription tier colors
        tier: {
          free: '#6B7280',
          individual: '#3B82F6',
          salon: '#8B5CF6',
        },
      },
    },
  },
  plugins: [],
}
