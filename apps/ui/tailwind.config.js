import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        graivy: {
          green: '#0DBE00',
          lime: '#C4FF22',
          dark: '#0a3d00',
        },
        surface: {
          page: 'var(--bg-page)',
          card: 'var(--bg-card)',
          header: 'var(--bg-header)',
          input: 'var(--bg-input)',
          nav: 'var(--bg-nav)',
        },
        line: {
          DEFAULT: 'var(--border)',
        },
        txt: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
        },
        btn: {
          bg: 'var(--graivy-btn-bg)',
          text: 'var(--graivy-btn-text)',
        },
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-8px)' },
          '40%, 80%': { transform: 'translateX(8px)' },
        },
        slideInFromTop: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [animate],
};
