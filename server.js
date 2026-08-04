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
import { MODEL } from './lib/generate.js';
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
  res.json({
    ok: true,
    model: MODEL,
    variants: VARIANT_COUNT,
    apiKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});

app.listen(PORT, () => {
  console.log(`\n  SiteForge running → http://localhost:${PORT}`);
  console.log(`  Model: ${MODEL}   Variants per request: ${VARIANT_COUNT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('\n  ⚠  ANTHROPIC_API_KEY is not set — the page loads but generation will fail.');
    console.log('     Copy .env.example to .env, add your key, then restart.\n');
  } else {
    console.log('  API key: configured ✓\n');
  }
});
