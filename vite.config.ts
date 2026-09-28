import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const site = (env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return {
  plugins: [
    {
      name: 'og-site-url',
      transformIndexHtml(html: string) {
        return html.replaceAll('%SITE_URL%', site);
      },
    },
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  envPrefix: ['VITE_', 'FIREBASE_'],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.ESG_API_PROXY || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  };
});
