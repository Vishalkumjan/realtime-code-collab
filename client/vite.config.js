import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Very important for Vercel builds
export default defineConfig({
  plugins: [react()],
  base: './', 
  define: {
    'process.env': {}
  }
})
