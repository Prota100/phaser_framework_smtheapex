import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Base public path
  base: '/',
  
  // Build configuration
  build: {
    outDir: 'dist',
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Copy static assets
    copyPublicDir: true,
    // Optimize for Phaser
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true
      }
    }
  },
  
  // Development server
  server: {
    port: 3000,
    host: true,
    cors: true,
    open: true
  },
  
  // Preview server (for production build testing)
  preview: {
    port: 3000,
    host: true,
    cors: true
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@examples': resolve(__dirname, 'examples'),
      '@assets': resolve(__dirname, 'assets')
    }
  },
  
  // Plugin configuration
  plugins: [],
  
  // Optimization for game development
  optimizeDeps: {
    include: [
      'phaser',
      'rxjs',
      'rxjs/operators'
    ]
  },
  
  // Define global constants
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __DEV__: process.env.NODE_ENV !== 'production'
  },
  
  // CSS configuration
  css: {
    devSourcemap: true
  },
  
  // Asset handling
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.mp3', '**/*.wav', '**/*.ogg']
})