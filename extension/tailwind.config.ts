import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'cortex': {
          'primary': '#6366f1',
          'secondary': '#8b5cf6',
          'accent': '#10b981',
          'bg': '#0f172a',
          'surface': '#1e293b',
          'text': '#f1f5f9',
          'muted': '#94a3b8',
        },
      },
    },
  },
  plugins: [],
};

export default config;
