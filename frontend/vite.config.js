import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  preview: {
    host: '0.0.0.0', // Bind to all network interfaces (required for Render)
    port: process.env.PORT || 4173, // Use Render's PORT env variable
    strictPort: false // Allow fallback if port is taken
  }
})
