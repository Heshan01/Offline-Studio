import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Crucial for Electron to load local build assets correctly via file://
  build: {
    outDir: 'dist',
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  }
});
