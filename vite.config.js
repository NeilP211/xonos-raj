import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served as a GitHub Pages project site at https://neilp211.github.io/xonos-raj/
export default defineConfig({
  base: '/xonos-raj/',
  plugins: [react()],
})
