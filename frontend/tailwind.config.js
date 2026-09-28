/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#050b1c',
          900: '#081229',
          800: '#0c1a38',
          700: '#122449',
          600: '#1a305c',
        },
        // Kept the old "brand" name so nothing breaks — now electric cyan.
        brand: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          900: '#164e63',
        },
        volt: '#a3ff5c',
        flame: { 400: '#ffa94d', 500: '#ff8a1f', 600: '#f06f00' },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(34,211,238,.25), 0 8px 40px -8px rgba(34,211,238,.35)',
        'glow-violet': '0 0 0 1px rgba(139,92,246,.3), 0 8px 40px -8px rgba(139,92,246,.45)',
        'glow-orange': '0 10px 36px -10px rgba(255,138,31,.75)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-ring': { '0%': { transform: 'scale(.6)', opacity: 0.9 }, '100%': { transform: 'scale(2.4)', opacity: 0 } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        'bar-slide': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(250%)' } },
      },
      animation: {
        'fade-up': 'fade-up .35s cubic-bezier(.2,.7,.2,1) both',
        shimmer: 'shimmer 1.4s infinite',
        'pulse-ring': 'pulse-ring 2.2s cubic-bezier(.2,.6,.3,1) infinite',
        float: 'float 5s ease-in-out infinite',
        'bar-slide': 'bar-slide 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
