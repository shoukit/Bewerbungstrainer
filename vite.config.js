import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative paths so chunks load correctly from WordPress plugin directory
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'src/main.jsx'),
        'video-training': path.resolve(__dirname, 'src/video-training.jsx')
      },
      output: {
        // Use fixed filenames for WordPress integration
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
        // Keep React in a shared vendor chunk to prevent duplicate instances
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-slot']
        }
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
