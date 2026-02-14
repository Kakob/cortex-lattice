import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import manifest from './public/manifest.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    rollupOptions: {
      input: {
        dashboard: resolve(__dirname, 'src/components/dashboard/index.html'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
