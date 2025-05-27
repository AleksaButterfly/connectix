import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base colors
        background: '#0a0a0a',
        'background-secondary': '#141414',
        'background-tertiary': '#1a1a1a',

        foreground: '#e4e4e7',
        'foreground-muted': '#a1a1aa',
        'foreground-subtle': '#71717a',

        // Terminal colors
        'terminal-green': '#50fa7b',
        'terminal-red': '#ff5555',
        'terminal-yellow': '#f1fa8c',
        'terminal-blue': '#8be9fd',
        'terminal-purple': '#bd93f9',
        'terminal-orange': '#ffb86c',
        'terminal-pink': '#ff79c6',

        // Accent colors
        accent: '#50fa7b',
        'accent-hover': '#5cfb7f',
        'accent-muted': '#50fa7b20',
      },
      borderColor: {
        DEFAULT: '#27272a',
        border: '#27272a',
        focus: '#50fa7b',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'terminal-blink': 'blink 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
      },
      boxShadow: {
        terminal: '0 0 20px rgba(80, 250, 123, 0.1)',
        'terminal-lg': '0 0 30px rgba(80, 250, 123, 0.15)',
      },
    },
  },
  plugins: [],
}

export default config
