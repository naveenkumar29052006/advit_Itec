import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite Configuration
 * 
 * Configures the development and build process for the application.
 * Documentation: https://vitejs.dev/config/
 */
export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: true
  }
  // },
  // css: {
  //   preprocessorOptions: {
  //     // CSS preprocessor options
  //   }
  // }
})
