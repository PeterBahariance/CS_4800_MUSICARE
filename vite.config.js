import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
        notif: './notif.html',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  plugins: [react()],
});
