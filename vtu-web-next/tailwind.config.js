/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        bg: 'hsl(var(--bg))',
        surface: 'hsl(var(--surface))',
        panel: 'hsl(var(--panel))',
        text: 'hsl(var(--text))',
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        brand: {
          50: '#eef6ff',
          100: '#d7eaff',
          200: '#add4ff',
          300: '#7db7ff',
          400: '#5292ff',
          500: '#2457f5',
          600: '#1740d1',
          700: '#1733a8',
          800: '#172f84',
          900: '#162b68',
        },
      },
      boxShadow: {
        soft: '0 16px 48px rgba(3, 7, 18, 0.24)',
        panel: '0 18px 60px rgba(9, 16, 31, 0.35)',
      },
      backgroundImage: {
        'axis-radial': 'radial-gradient(circle at top, rgba(36,87,245,0.22), transparent 55%)',
        'axis-grid': 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '44px 44px',
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.5rem',
      },
    },
  },
  plugins: [],
};
