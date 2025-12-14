import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// s://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
})
