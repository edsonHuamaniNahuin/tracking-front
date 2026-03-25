import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

import tsconfigPaths from 'vite-tsconfig-paths'



import path from 'path'

export default defineConfig({
   plugins: [
    tsconfigPaths(),
   svgr(),
    react(),      // ← luego react
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
    proxy: {
      // Proxyea las llamadas a /api/* hacia tu backend Laravel
      '/api': {
        target: process.env.VITE_API_LOCAL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
