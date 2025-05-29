import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react', 'resend']
  },
  build: {
    rollupOptions: {
      external: ['resend'], // Removed 'crypto'
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          pdf: ['pdfjs-dist']
        }
      }
    },
    target: 'esnext'
  },
  server: {
    hmr: {
      overlay: false
    },
    headers: {
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    }
  }
});
