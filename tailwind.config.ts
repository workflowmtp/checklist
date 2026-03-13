import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      colors: {
        ps: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          card: 'var(--bg-card)',
          'card-hover': 'var(--bg-card-hover)',
          input: 'var(--bg-input)',
          sidebar: 'var(--bg-sidebar)',
          header: 'var(--bg-header)',
          modal: 'var(--bg-modal)',
        },
        border: {
          DEFAULT: 'var(--border-primary)',
          primary: 'var(--border-primary)',
          secondary: 'var(--border-secondary)',
          focus: 'var(--border-focus)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
        },
        accent: {
          blue: 'var(--accent-blue)',
          'blue-dim': 'var(--accent-blue-dim)',
          green: 'var(--accent-green)',
          'green-dim': 'var(--accent-green-dim)',
          red: 'var(--accent-red)',
          'red-dim': 'var(--accent-red-dim)',
          orange: 'var(--accent-orange)',
          'orange-dim': 'var(--accent-orange-dim)',
          purple: 'var(--accent-purple)',
          'purple-dim': 'var(--accent-purple-dim)',
          cyan: 'var(--accent-cyan)',
          'cyan-dim': 'var(--accent-cyan-dim)',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.12)',
        md: '0 4px 12px rgba(0,0,0,0.15)',
        lg: '0 8px 30px rgba(0,0,0,0.2)',
        glow: '0 0 20px rgba(59,130,246,0.15)',
      },
      spacing: {
        'sidebar': '260px',
        'sidebar-collapsed': '68px',
        'header': '60px',
      },
      animation: {
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'toast-in': 'toastIn 0.3s ease forwards',
        'msg-in': 'msgIn 0.3s ease forwards',
        'typing': 'typingBounce 1.2s ease-in-out infinite',
        'stop-flash': 'stopFlash 2s ease-in-out infinite',
      },
      keyframes: {
        toastIn: {
          from: { opacity: '0', transform: 'translateX(30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        msgIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        typingBounce: {
          '0%, 80%, 100%': { transform: 'scale(0.7)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
        stopFlash: {
          '0%, 100%': { borderColor: 'var(--accent-red)' },
          '50%': { borderColor: 'rgba(239,68,68,0.4)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
