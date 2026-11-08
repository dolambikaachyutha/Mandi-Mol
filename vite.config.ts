import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {defineConfig, loadEnv} from 'vite';
import {netlifyFunctionsDevPlugin} from './server/devApiPlugin.ts';

export default defineConfig(({mode}) => {
  // Make server-side variables (GNANI_API_KEY, voice/model overrides) available
  // to the Netlify function handlers that run inside the dev server.
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      netlifyFunctionsDevPlugin({
        functionsDir: path.join(process.cwd(), 'netlify', 'functions'),
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
