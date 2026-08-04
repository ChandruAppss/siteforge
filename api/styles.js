/* Vercel serverless function — tells the browser which design directions to
   request, and whether the server is configured to generate at all. */

import { STYLES, VARIANT_COUNT } from '../lib/styles.js';
import { MODEL } from '../lib/generate.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
  res.status(200).json({
    model: MODEL,
    apiKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    styles: STYLES.slice(0, VARIANT_COUNT).map((s, i) => ({
      index: i,
      name: s.name,
      note: s.note,
    })),
  });
}
