import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Very important for Vercel builds
export default defineConfig({
  plugins: [react()],
  base: './', 
  define: {
    'process.env': {}
  },
  // 🎯 FINAL FIX: PostCSS/Tailwind Build Error ko resolve karne ke liye
  css: {
    // Vite ko batao ki PostCSS config ab .cjs file mein hai
    postcss: './postcss.config.cjs',
  }
})