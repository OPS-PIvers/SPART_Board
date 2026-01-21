import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          firebase: [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage',
          ],
          'dnd-kit': [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
          ],
        },
      },
    },
  },
});
