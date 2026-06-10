import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// Use env var if set; fall back to localhost:8000 for local dev
const API_PROXY_TARGET = process.env.VITE_API_BASE || process.env.VITE_AI_API_BASE || 'https://mqn8mdsb-8000.inc1.devtunnels.ms'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    allowedHosts: ['shanda-danceable-roxanne.ngrok-free.dev'],
    proxy: {
      // Forward any /api requests to the backend during development
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
