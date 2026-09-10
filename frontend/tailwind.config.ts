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
          offwhite: '#F6F6F6',
          vivid: '#FE8D01',
          deep: '#EB5C00',
          rust: '#B23904',
        },
      },
    },
  },
  plugins: [],
};

export default config;
