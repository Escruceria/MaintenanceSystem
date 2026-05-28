import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172033',
        field: '#f4f7fb',
        line: '#d8e1ec',
        brand: '#0f766e',
        accent: '#b45309',
      },
    },
  },
  plugins: [],
};

export default config;

