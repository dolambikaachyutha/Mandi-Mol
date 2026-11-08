import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {defineConfig, loadEnv} from 'vite';
import {apiDevPlugin} from './server/devApiPlugin.ts';

export default defineConfig(({mode, command}) => {
  if (command === 'serve') {
    // Load server-side variables only for the local function middleware.
    const env = loadEnv(mode, process.cwd(), '');
    for (const [key, value] of Object.entries(env)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      apiDevPlugin({
        functionsDir: path.join(process.cwd(), 'server', 'functions'),
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
