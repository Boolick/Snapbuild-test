/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0e11',
        panel: '#11161b',
        'panel-subtle': '#161c22',
        border: '#2a333d',
        'border-focus': '#7d8cff',
        text: {
          DEFAULT: '#eef3f8',
          muted: '#97a3ae',
          dim: '#62707e',
        },
        brand: {
          DEFAULT: '#7d8cff',
          hover: '#6677ff',
          dim: 'rgba(125, 140, 255, 0.15)',
        },
        status: {
          idle: '#64748b',
          queued: '#f59e0b',
          running: '#3b82f6',
          success: '#10b981',
          error: '#ef4444',
        },
        port: {
          text: '#60a5fa',
          image: '#a78bfa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(125, 140, 255, 0.6))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 2px rgba(125, 140, 255, 0.2))' },
        },
      },
    },
  },
  plugins: [],
};
