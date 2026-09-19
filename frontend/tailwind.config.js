/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#ef233c',      // Red Noir Crimson Accent
          secondary: '#d90429',    // Deep Crimson
          accent: '#ff4d6d',       // Bright Scarlet
          glow: 'rgba(239, 35, 60, 0.5)',
          red: '#ef233c',
          darkRed: '#1a0505',
          cyan: '#00D1FF',
          purple: '#8B5CF6',
        },
        dark: {
          bg: '#000000',
          surface: '#0d0d11',
          surfaceLight: '#18181b',
          border: 'rgba(255, 255, 255, 0.1)',
          text: '#FFFFFF',
          muted: '#a1a1aa',
        },
        light: {
          bg: '#000000',
          surface: '#0d0d11',
          surfaceDark: '#18181b',
          border: 'rgba(255, 255, 255, 0.1)',
          text: '#FFFFFF',
          muted: '#a1a1aa',
        },
        zinc: {
          850: '#1e1e24',
          950: '#09090b',
        }
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #ef233c 0%, #ff4d6d 100%)',
        'brand-gradient-diagonal': 'linear-gradient(135deg, #ef233c 0%, #d90429 50%, #ff4d6d 100%)',
        'red-noir-glow': 'radial-gradient(circle at center, rgba(239, 35, 60, 0.15) 0%, transparent 70%)',
      },
      animation: {
        'fade-up': 'fade-in-up 0.8s ease-out forwards',
        'border-spin': 'border-spin 2.5s linear infinite',
        'star-1': 'animStar 50s linear infinite',
        'star-2': 'animStar 80s linear infinite',
      },
      keyframes: {
        'fade-in-up': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'border-spin': {
          'from': { '--gradient-angle': '0deg' },
          'to': { '--gradient-angle': '360deg' },
        },
        'animStar': {
          'from': { transform: 'translateY(0px)' },
          'to': { transform: 'translateY(-2000px)' },
        },
      },
    },
  },
  plugins: [],
}
