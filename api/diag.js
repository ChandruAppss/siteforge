/* Diagnostic: makes the smallest possible real Claude call and reports exactly
 * what came back.
 *
 * Exists because a failing generation is otherwise opaque — the browser only
 * ever sees "this design failed", and a 502 could be a bad key, an unavailable
 * model, a quota problem or a timeout. This isolates the API call itself.
 *
 * max_tokens is 1, so the cost is negligible. No access code needed (you can't
 * debug an outage from behind the gate you're trying to test), but rate limited
 * so it can't be hammered. Safe to leave deployed; it returns no secrets.
 */

import Anthropic from '@anthropic-ai/sdk';
import { MODEL, generateWebsite } from '../lib/generate.js';
import { rateLimit } from '../lib/ratelimit.js';

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  const limit = rateLimit(req);
  if (!limit.allowed) {
    return res.status(429).json({ error: 'Rate limited', retryAfter: limit.retryAfter });
  }

  const key = process.env.ANTHROPIC_API_KEY || '';
  const report = {
    model: MODEL,
    apiKeyPresent: Boolean(key),
    // Shape only — never the value.
    apiKeyLooksValid: /^sk-ant-/.test(key),
    apiKeyLength: key.length,
  };

  if (!key) {
    return res.status(500).json({ ...report, ok: false, error: 'ANTHROPIC_API_KEY is not set' });
  }

  // ?full=1 runs one REAL generation through the production code path. Costs
  // real credit, so it is temporary — remove this endpoint once diagnosed.
  if (req.query?.full === '1') {
    const t0 = Date.now();
    try {
      const result = await generateWebsite({
        businessName: 'Aroma Coffee House',
        businessDescription:
          'A speciality coffee shop in Pune serving pour-over, cold brew and fresh-baked croissants. Open 7am to 9pm.',
        styleIndex: 0,
      });
      return res.status(200).json({
        ...report,
        ok: true,
        mode: 'full',
        elapsedMs: Date.now() - t0,
        htmlBytes: result.html.length,
        style: result.style,
        htmlStartsWith: result.html.slice(0, 60),
      });
    } catch (err) {
      return res.status(200).json({
        ...report,
        ok: false,
        mode: 'full',
        elapsedMs: Date.now() - t0,
        errorName: err?.name,
        errorStatus: err?.status,
        errorType: err?.error?.type || err?.type,
        errorMessage: err?.message,
      });
    }
  }

  const started = Date.now();
  try {
    const anthropic = new Anthropic({ apiKey: key });
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1,
      messages: [{ role: 'user', content: 'hi' }],
    });

    return res.status(200).json({
      ...report,
      ok: true,
      elapsedMs: Date.now() - started,
      stopReason: msg.stop_reason,
      usage: msg.usage,
    });
  } catch (err) {
    return res.status(200).json({
      ...report,
      ok: false,
      elapsedMs: Date.now() - started,
      errorName: err?.name,
      errorStatus: err?.status,
      errorType: err?.error?.type || err?.type,
      errorMessage: err?.message,
    });
  }
}
