import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#8C52FF',
          aqua: '#72FFCC',
          bg: '#F9F8F6',
          ink: '#16161a',
        }
      }
    }
  },
  plugins: []
}

export default config
