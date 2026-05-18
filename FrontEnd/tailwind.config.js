/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink:          { DEFAULT: '#0a0a0f' },
        cream:        { DEFAULT: '#f7f5f2' },
        accent:       { DEFAULT: '#ff4d1c', dark: '#e03c10' },
        muted:        { DEFAULT: '#888888' },
        'brand-border': { DEFAULT: '#e8e5e0' },
        navy:         { DEFAULT: '#1a2f4e', light: '#243c61', dark: '#0f1e33' },
      },
      boxShadow: {
        card:        '0 2px 20px rgba(0,0,0,0.07)',
        'card-hover':'0 20px 60px rgba(255,77,28,0.12), 0 8px 30px rgba(0,0,0,0.1)',
        glow:        '0 0 30px rgba(255,77,28,0.35)',
        'navy':      '0 8px 32px rgba(26,47,78,0.3)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer:  'shimmer 1.6s infinite linear',
        'fade-up':'fade-up 0.4s ease forwards',
      },
    },
  },
  plugins: [],
}
