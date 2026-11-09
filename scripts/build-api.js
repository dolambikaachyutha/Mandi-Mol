import esbuild from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';

const entries = [
  'coach',
  'health',
  'stt',
  'trader',
  'tts',
  'prices',
  'planner',
  'practiceSession',
  'practiceTurn',
  'deals',
  'alerts',
  'fpoDashboard',
  'voiceQuery',
  'profile',
  'consent',
  'whatsappWebhook',
];

const apiDir = path.resolve('api');

if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

async function buildAll() {
  console.log(`[build-api] Bundling ${entries.length} API functions for Vercel...`);
  for (const name of entries) {
    const entryPath = path.resolve(`server/api-entries/${name}.ts`);
    const outPath = path.resolve(`api/${name}.js`);

    await esbuild.build({
      entryPoints: [entryPath],
      bundle: true,
      platform: 'node',
      target: 'node22',
      format: 'esm',
      outfile: outPath,
    });
    console.log(`✓ Bundled api/${name}.js`);
  }
}

buildAll().catch((err) => {
  console.error('[build-api] Build failed:', err);
  process.exit(1);
});
