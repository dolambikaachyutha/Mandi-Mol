import esbuild from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';

const apiDir = path.resolve('api');

// Clean out existing bundles to guarantee at most 1 Serverless Function
if (fs.existsSync(apiDir)) {
  const existingFiles = fs.readdirSync(apiDir);
  for (const file of existingFiles) {
    if (file.endsWith('.js') || file.endsWith('.js.map')) {
      fs.unlinkSync(path.join(apiDir, file));
    }
  }
} else {
  fs.mkdirSync(apiDir, { recursive: true });
}

async function buildUnifiedApi() {
  console.log('[build-api] Bundling unified API router for Vercel Hobby plan (1 Serverless Function)...');
  const entryPath = path.resolve('server/api-entries/index.ts');
  const outPath = path.resolve('api/index.js');

  await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    outfile: outPath,
    minify: false,
    sourcemap: false,
  });

  const stats = fs.statSync(outPath);
  console.log(`✓ Bundled api/index.js (${Math.round(stats.size / 1024)} KB)`);
  console.log(`✓ Total Vercel Serverless Functions: 1 (Hobby limit is 12). Deploy ready!`);
}

buildUnifiedApi().catch((err) => {
  console.error('[build-api] Build failed:', err);
  process.exit(1);
});
