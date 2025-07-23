import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import nodePolyfills from 'rollup-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      stream: 'stream-browserify',
      buffer: 'buffer',
      process: 'process/browser',
      events: 'events/',
      util: 'util/',
    },
  },
  optimizeDeps: {
    include: [
      'buffer',
      'process',
      'stream-browserify',
      'events',
      'util',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
        process: 'process',
        Buffer: 'Buffer',
      },
    },
  },
  build: {
    rollupOptions: {
      plugins: [nodePolyfills()],
    },
  },
  define: {
    'process.env': {},
  },
})