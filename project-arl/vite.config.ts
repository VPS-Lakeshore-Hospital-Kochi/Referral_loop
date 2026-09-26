import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the build can be served from any sub-path (GitHub Pages, intranet share).
export default defineConfig({
  plugins: [react()],
  base: './',
  // Skip CSS minification: the minifier rewrites rgba() as 8-digit hex, which older Safari ignores.
  build: { cssMinify: false },
})
