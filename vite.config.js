import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Use fixed filenames for WordPress integration
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/index.[ext]'
      }
    }
  },
  server: {
    port: 5173,
    host: true, // Allow access from network
    cors: true, // Enable CORS
    strictPort: false, // Use different port if 5173 is taken
    open: true, // Auto-open browser on server start
  },
  preview: {
    port: 4173,
    host: true,
    cors: true,
  },
})
