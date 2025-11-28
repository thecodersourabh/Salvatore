import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Use relative paths for mobile, absolute for web
  base: process.env.NODE_ENV === 'production' && !process.env.VITE_WEB_BUILD ? './' : '/Salvatore/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  worker: {
    format: 'es',
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        // Improved chunk naming with shorter hashes to reduce cache issues
        chunkFileNames: '[name]-[hash:8].js',
        entryFileNames: '[name]-[hash:8].js',
        assetFileNames: '[name]-[hash:8].[ext]',
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-tabs'],
          // Separate lazy-loaded components into their own chunks
          dashboard: ['src/components/Dashboard/QuickActions.tsx'],
        },
      },
    },
    // Increase chunk size warning limit since we're using code splitting
    chunkSizeWarningLimit: 1000,
  },
  define: {
    global: 'globalThis',
  },
});