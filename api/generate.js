/* Vercel serverless function — generates ONE website per invocation.
   The browser fires several of these in parallel, which keeps each function
   short-lived and stateless (no shared job store to go missing between
   serverless instances). */

import { generateWebsite, validateInput, MODEL } from '../lib/generate.js';

export const config = {
  maxDuration: 60,   // seconds; raise to 300 on a Vercel Pro plan
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
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
