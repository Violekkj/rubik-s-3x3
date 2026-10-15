/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cube: {
          bg: '#030F1A',
          surface1: '#081A2B',
          surface2: '#0E253B',
          surface3: '#153350',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(0, 212, 255, 0.3)',
          cyan: '#00D4FF',
          cyanGlow: 'rgba(0, 212, 255, 0.25)',
          text: '#E8F1F8',
          textMuted: '#8BA2B8',
          textDim: '#536E87',
          // Cores oficiais do cubo
          white: '#F4F4F4',
          yellow: '#FFE600',
          green: '#2BE04B',
          blue: '#1E63FF',
          red: '#FF3B3B',
          orange: '#FF8A1E',
          // Cores do timer
          timerReady: '#2BE04B',
          timerHolding: '#FF3B3B',
          timerInspect: '#FFB800',
          timerInspectWarn: '#FF3B3B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
