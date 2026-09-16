import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.saavncdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'saavn-images', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 } }
          },
          {
            urlPattern: /^https:\/\/lrclib\.net\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'lyrics', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 } }
          },
          {
            urlPattern: /^https:\/\/jioo-xi\.vercel\.app\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 } }
          }
        ]
      },
      manifest: {
        name: 'kiku.',
        short_name: 'kiku',
        description: 'made for late-night listening',
        theme_color: '#0E0E15',
        background_color: '#0E0E15',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: { 
    host: '0.0.0.0', 
    allowedHosts: true as any, 
    headers: { 'X-Frame-Options': 'ALLOWALL' } 
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'motion': ['motion'],
          'ogl': ['ogl'],
          'zustand': ['zustand']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'motion']
  }
})
