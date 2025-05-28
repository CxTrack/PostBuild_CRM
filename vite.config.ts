import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react', 'resend']
  },
  build: {
    rollupOptions: {
      external: ['resend', 'crypto'],
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