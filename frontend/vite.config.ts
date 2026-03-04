import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward all /api requests to the backend – no CORS issue in any environment
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Forward Socket.IO WebSocket traffic through Vite dev server
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
