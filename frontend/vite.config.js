import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Long-lived, cacheable vendor chunks; pages are split per route.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          net: ['axios'],
        },
      },
    },
  },
});
