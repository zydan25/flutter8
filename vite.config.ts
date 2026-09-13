import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/flutter8/' : '/',
  plugins: [react(), tailwindcss()],
  server: { port: 3000, host: '0.0.0.0', strictPort: true, allowedHosts: true },
  preview: { port: 3000, host: '0.0.0.0', strictPort: true, allowedHosts: true },
});
