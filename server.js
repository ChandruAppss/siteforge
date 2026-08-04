/* ==========================================================================
   Local development server.

   Mounts the exact same handlers Vercel runs as serverless functions, so what
   you test locally is what deploys. In production Vercel serves ./public as
   static files and ./api/*.js as functions — this file just recreates that.
   ========================================================================== */

import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import generateHandler from './api/generate.js';
import stylesHandler from './api/styles.js';
import { providerStatus, PROVIDERS } from './lib/providers/index.js';
import { VARIANT_COUNT } from './lib/styles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Same handlers, same paths as the deployed functions.
app.post('/api/generate', generateHandler);
app.get('/api/styles', stylesHandler);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, variants: VARIANT_COUNT, ...providerStatus() });
});

app.listen(PORT, () => {
  const status = providerStatus();
  console.log(`\n  SiteForge running → http://localhost:${PORT}`);

  if (process.env.MOCK_GENERATION === '1') {
    console.log('  Provider: MOCK (no API calls, no cost)\n');
    return;
  }

  if (status.error) {
    console.log(`\n  ⚠  ${status.error}`);
    console.log('     The page loads, but generation will fail. Options:\n');
    for (const p of PROVIDERS) {
      console.log(`       ${p.freeTier ? '[free tier]' : '[paid]    '} ${p.keyEnv.padEnd(20)} ${p.keyUrl}`);
    }
    console.log('\n     Set one in .env, then restart.\n');
    return;
  }

  console.log(`  Provider: ${status.providerLabel}${status.freeTier ? ' (free tier)' : ''}`);
  console.log(`  Model: ${status.model}   Variants per request: ${VARIANT_COUNT}\n`);
});
