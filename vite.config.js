import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { PORT } from './backend/config'

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:${PORT}`,
        changeOrigin: true
      }
    }
  }
})