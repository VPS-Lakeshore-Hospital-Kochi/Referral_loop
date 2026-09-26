import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the build can be served from any sub-path (GitHub Pages, intranet share).
export default defineConfig({
  plugins: [react()],
  base: './',
})
