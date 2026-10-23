/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ice: '#EEF6FC',         // Soft icy blue
          pale: '#EAF3FA',        // Pale blue section background
          paper: '#F1F7FC',       // Requested subtle icy-blue base tint across all pages
          surface: '#FFFFFF',     // Clean white surface for cards
          card: '#FFFFFF',        // Cards slightly lighter than page background
          creamy: '#FAFCFE',      // Creamy white alternate surface
          navy: {
            DEFAULT: '#122238',   // Deep, sharp contrast navy for headings
            800: '#172B46',
            900: '#122238',
            950: '#0B1726',
          },
          indigo: {
            DEFAULT: '#344A78',   // Elegant indigo
            light: '#4A6296',
            dark: '#243456',
          },
          teal: {
            DEFAULT: '#0D817B',   // Botanical teal
            hover: '#0A6E69',
            light: '#139B94',
            50: '#F0F9F8',
            100: '#DDF4EF',       // Soft teal
            200: '#BCE8E0',
            700: '#0D817B',
            800: '#09635F',
            900: '#064946',
          },
          muted: '#3E556E',       // Sharper, high-contrast readable secondary copy
          border: '#D7E5F0',      // Delicate borders
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(20, 36, 63, 0.04), 0 1px 2px -1px rgba(20, 36, 63, 0.03)',
        'card': '0 4px 16px 0 rgba(20, 36, 63, 0.05), 0 1px 3px 0 rgba(20, 36, 63, 0.02)',
        'card-hover': '0 12px 28px -4px rgba(20, 36, 63, 0.09), 0 4px 8px -2px rgba(20, 36, 63, 0.03)',
        'elevated': '0 20px 40px -8px rgba(20, 36, 63, 0.12)',
      }
    },
  },
  plugins: [],
}
