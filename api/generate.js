/* Vercel serverless function — generates ONE website per invocation.
   The browser fires several of these in parallel, which keeps each function
   short-lived and stateless (no shared job store to go missing between
   serverless instances). */

import { generateWebsite, validateInput, MODEL } from '../lib/generate.js';
import { rateLimit, codeMatches, accessCodeRequired } from '../lib/ratelimit.js';

// Inline config wins over vercel.json, so this has to match it or it silently
// caps the limit. A full page generation runs 40-90s; 300 leaves real headroom.
export const config = {
  maxDuration: 300,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Gate 1: shared access code (the real protection) ──────────────────
  if (accessCodeRequired() && !codeMatches(req.body?.accessCode, process.env.ACCESS_CODE)) {
    return res.status(401).json({
      error: 'That access code is not right.',
      code: 'BAD_ACCESS_CODE',
    });
  }

  // ── Gate 2: per-IP rate limit (best-effort, see lib/ratelimit.js) ─────
  const limit = rateLimit(req);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    return res.status(429).json({
      error: `Too many websites generated from this connection. Try again in about ${Math.ceil(limit.retryAfter / 60)} minutes.`,
      code: 'RATE_LIMITED',
    });
  }

  const parsed = validateInput(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY is not set. Add it in Vercel → Settings → Environment Variables, then redeploy.',
    });
  }

  const started = Date.now();
  try {
    const result = await generateWebsite(parsed);
    console.log(`✓ ${result.style} — ${(result.html.length / 1024).toFixed(1)}KB in ${((Date.now() - started) / 1000).toFixed(1)}s (${MODEL})`);
    return res.status(200).json({ ...result, status: 'ready' });
  } catch (err) {
    const message = err?.message || 'Generation failed';
    console.error(`✗ style ${parsed.styleIndex} — ${message}`);
    return res.status(502).json({ error: message, status: 'failed' });
  }
}
