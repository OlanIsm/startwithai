import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          base: '#050508',
          surface: 'rgba(255, 255, 255, 0.04)',
          primary: '#2563EB',
          glow: '#3B82F6',
          light: '#60A5FA',
          muted: '#93C5FD',
        },
      },
    },
  },
  plugins: [],
};

export default config;
