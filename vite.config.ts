import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'frontend/public',
  build: { target: 'es2022', outDir: 'dist', assetsDir: 'assets' },
  server: { proxy: { '/api': 'http://127.0.0.1:8080', '/health': 'http://127.0.0.1:8080' } }
});
