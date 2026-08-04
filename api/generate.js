/* Vercel serverless function — generates ONE website per invocation and
   streams it back as the model writes it.

   The browser fires several of these in parallel. Each is short-lived and
   stateless (no shared job store to go missing between serverless instances),
   and because the response streams, a partial page can be painted within a
   couple of seconds instead of after a minute and a half of blank spinner. */

import { streamWebsite, validateInput } from '../lib/generate.js';
import { resolveProvider } from '../lib/providers/index.js';
import { rateLimit, codeMatches, accessCodeRequired } from '../lib/ratelimit.js';

export const config = {
  maxDuration: 300,
};

/* Streaming means the status code is committed before we know whether the
   generation will succeed. A failure after the first byte is signalled with
   this trailer, which the client checks for. */
export const ERROR_SENTINEL = '<!--SITEFORGE_ERROR:';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (accessCodeRequired() && !codeMatches(req.body?.accessCode, process.env.ACCESS_CODE)) {
    return res.status(401).json({ error: 'That access code is not right.', code: 'BAD_ACCESS_CODE' });
  }

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

  // Mock mode needs no provider — checking first would make it unreachable.
  if (process.env.MOCK_GENERATION !== '1') {
    const { error } = resolveProvider();
    if (error) return res.status(500).json({ error });
  }

  const started = Date.now();
  let bytesSent = 0;

  try {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    // Tell any proxy in front of us not to buffer, or streaming is pointless.
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Vercel buffers the head of a streamed response, so the first real bytes
    // can sit unsent for many seconds — which defeats the point of streaming.
    // An immediate padded comment pushes past that buffer so chunks flow from
    // the start. The client strips anything before <!DOCTYPE.
    res.write(`<!--${' '.repeat(2048)}-->\n`);

    const result = await streamWebsite({
      ...parsed,
      onChunk: (text) => {
        bytesSent += text.length;
        res.write(text);
      },
    });

    res.end();
    const { provider, model } = resolveProvider();
    console.log(`✓ ${result.style} — ${(result.html.length / 1024).toFixed(1)}KB in ${((Date.now() - started) / 1000).toFixed(1)}s (${provider?.id}/${model})`);
  } catch (err) {
    const message = (err?.message || 'Generation failed').replace(/-->/g, '--');
    console.error(`✗ style ${parsed.styleIndex} — ${message}`);

    if (bytesSent === 0 && !res.headersSent) {
      return res.status(502).json({ error: message, status: 'failed' });
    }
    // Already streaming — the status is long gone, so signal in-band.
    res.write(`\n${ERROR_SENTINEL}${message}-->`);
    res.end();
  }
}
