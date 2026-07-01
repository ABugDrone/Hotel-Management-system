/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0F1117',
          surface: '#1A1D27',
          elevated: '#22263A',
        },
        border: '#2E3348',
        accent: {
          primary: '#4F7FFF',
          warm: '#F5A623',
        },
        status: {
          green: '#2ECC71',
          red: '#E74C3C',
          yellow: '#F1C40F',
          gray: '#7F8C8D',
        },
        text: {
          primary: '#EAEAEA',
          muted: '#8892AA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular'],
      },
    },
  },
  plugins: [],
} satisfies Config
