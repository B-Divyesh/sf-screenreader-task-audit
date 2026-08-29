import { defineConfig } from 'vite';
import { readFileSync, writeFileSync } from 'node:fs';

export default defineConfig({
  publicDir: 'frontend/public',
  plugins: [{
    name: 'stamp-static-404-build',
    closeBundle() {
      const path = 'dist/404.html';
      const html = readFileSync(path, 'utf8');
      writeFileSync(path, html.replace('__BUILD_SHA__', process.env.VITE_BUILD_SHA || 'dev'));
    }
  }],
  build: { target: 'es2022', outDir: 'dist', assetsDir: 'assets' },
  server: { proxy: { '/api': 'http://127.0.0.1:8080', '/health': 'http://127.0.0.1:8080' } }
});
