/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#05070D',
        panel: '#0C111C',
        line: '#1C2436',
        ivory: '#EEF1F7',
        mute: '#8A94AB',
        iris: '#6D5BFF',
        tungsten: { DEFAULT: '#FFB347', soft: '#FFD08A' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'spin-rev': { from: { transform: 'rotate(360deg)' }, to: { transform: 'rotate(0deg)' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(18px)' }, to: { opacity: '1', transform: 'none' } },
        pop: { from: { opacity: '0', transform: 'scale(0.97)' }, to: { opacity: '1', transform: 'none' } },
        glow: { '0%, 100%': { opacity: '0.55', transform: 'scale(1)' }, '50%': { opacity: '1', transform: 'scale(1.1)' } },
      },
      animation: {
        'spin-slow': 'spin 80s linear infinite',
        'spin-rev': 'spin-rev 55s linear infinite',
        'fade-up': 'fade-up 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        pop: 'pop 0.25s ease-out both',
        glow: 'glow 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
