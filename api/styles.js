/* Vercel serverless function — tells the browser which design directions to
   request, whether the server can generate at all, and whether an access code
   is needed before it will. */

import { STYLES, VARIANT_COUNT } from '../lib/styles.js';
import { MODEL } from '../lib/generate.js';
import { accessCodeRequired } from '../lib/ratelimit.js';

export default function handler(req, res) {
  // Must not be cached at the edge — the answer depends on server env vars
  // that can change with a redeploy.
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    model: MODEL,
    apiKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    accessCodeRequired: accessCodeRequired(),
    styles: STYLES.slice(0, VARIANT_COUNT).map((s, i) => ({
      index: i,
      name: s.name,
      note: s.note,
    })),
  });
}
