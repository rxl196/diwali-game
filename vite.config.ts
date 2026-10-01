import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://<user>.github.io/diwali-game/ on GitHub Pages
  base: process.env.GITHUB_PAGES === 'true' ? '/diwali-game/' : '/',
  plugins: [react()],
})
