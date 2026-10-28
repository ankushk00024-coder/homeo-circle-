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
        hand: ['"Gochi Hand"', '"Comic Sans MS"', 'cursive'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(20, 36, 63, 0.04), 0 1px 2px -1px rgba(20, 36, 63, 0.03)',
        'card': '0 4px 16px 0 rgba(20, 36, 63, 0.05), 0 1px 3px 0 rgba(20, 36, 63, 0.02)',
        'card-hover': '0 12px 28px -4px rgba(20, 36, 63, 0.09), 0 4px 8px -2px rgba(20, 36, 63, 0.03)',
        'elevated': '0 20px 40px -8px rgba(20, 36, 63, 0.12)',
        'glow': '0 10px 30px -8px rgba(13, 129, 123, 0.45)',
        // Tailwind v4 names already used across the codebase
        '2xs': '0 1px 0 0 rgba(20, 36, 63, 0.04)',
        'xs': '0 1px 2px 0 rgba(20, 36, 63, 0.06)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -24px) scale(1.08)' },
          '66%': { transform: 'translate(-22px, 16px) scale(.95)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'word-rise': {
          from: { opacity: '0', transform: 'translateY(0.6em) rotate(2deg)', filter: 'blur(6px)' },
          to: { opacity: '1', transform: 'translateY(0) rotate(0)', filter: 'blur(0)' },
        },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-in': 'fade-in .3s ease-out both',
        'fade-up': 'fade-up .6s cubic-bezier(.22,1,.36,1) both',
        'slide-down': 'slide-down .18s ease-out both',
        'scale-in': 'scale-in .22s cubic-bezier(.22,1,.36,1) both',
        float: 'float 7s ease-in-out infinite',
        blob: 'blob 20s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        'gradient-pan': 'gradient-pan 12s ease infinite',
        'word-rise': 'word-rise .8s cubic-bezier(.22,1,.36,1) both',
        marquee: 'marquee 40s linear infinite',
        'spin-slow': 'spin-slow 40s linear infinite',
      },
    },
  },
  plugins: [],
}
