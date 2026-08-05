/* TEMPORARY diagnostic — makes the smallest possible real provider call and
   reports what came back. max_tokens is 1, so the cost is negligible.

   Ungated on purpose: you cannot debug an outage from behind the access gate
   you are trying to test. Rate limited, returns no secrets, and should be
   deleted once the question it was added to answer is answered. */

import { resolveProvider } from '../lib/providers/index.js';
import { rateLimit } from '../lib/ratelimit.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  const limit = rateLimit(req);
  if (!limit.allowed) return res.status(429).json({ error: 'Rate limited' });

  const { provider, model, apiKey, error } = resolveProvider();
  if (error) return res.status(500).json({ ok: false, error });

  const started = Date.now();
  try {
    let out = '';
    await provider.stream({
      prompt: 'Reply with the single word: ok',
      model,
      maxTokens: 1,
      apiKey,
      onChunk: (t) => { out += t; },
    });

    return res.status(200).json({
      ok: true,
      provider: provider.id,
      model,
      elapsedMs: Date.now() - started,
      replyChars: out.length,
    });
  } catch (err) {
    return res.status(200).json({
      ok: false,
      provider: provider.id,
      model,
      elapsedMs: Date.now() - started,
      errorMessage: String(err?.message || err).slice(0, 400),
    });
  }
}
