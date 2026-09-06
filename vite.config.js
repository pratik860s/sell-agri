import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import apiPlugin from './scripts/vite-plugin-api.js'

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: { port: 5173 },
  build: { outDir: 'dist', sourcemap: false }
})
