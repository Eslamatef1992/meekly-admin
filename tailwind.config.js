/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Cairo', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // MEKKY brand
        brand: {
          50:  '#eef0fb',
          100: '#d6dbf3',
          200: '#aab2e3',
          300: '#7d89d2',
          400: '#5160c1',
          500: '#3f4ead',
          600: '#333b83',
          700: '#2b3270',
          800: '#222858',
          900: '#1a1e44',
        },
        accent: {
          50:  '#e9f4fb',
          100: '#cce6f5',
          200: '#9bcdec',
          300: '#69b4e2',
          400: '#42a4dc',
          500: '#2e9dd7',
          600: '#1f86bc',
          700: '#196d99',
          800: '#13567a',
          900: '#0f4561',
        },
        // Pastel surfaces (for cards, tags, KPI tiles)
        surface: {
          lavender: '#efeafe',
          violet:   '#e9e4ff',
          sky:      '#e7f0ff',
          mint:     '#e3f7ec',
          peach:    '#ffe9da',
          rose:     '#fde3e9',
          cream:    '#fef3df',
          stone:    '#f4f4f6',
        },
        danger: { 500: '#e62830', 600: '#c81f27' },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 1px 8px rgba(15,23,42,0.04)',
      },
    },
  },
  plugins: [],
};
