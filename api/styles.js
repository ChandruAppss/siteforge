/* Vercel serverless function — tells the browser which design directions to
   request, whether the server can generate at all, and whether an access code
   is needed before it will. */

import { STYLES, VARIANT_COUNT } from '../lib/styles.js';
import { providerStatus } from '../lib/providers/index.js';
import { accessCodeRequired } from '../lib/ratelimit.js';

export default function handler(req, res) {
  // Must not be cached at the edge — the answer depends on server env vars
  // that can change with a redeploy.
  res.setHeader('Cache-Control', 'no-store');

  // In mock mode there is no provider and none is needed — report that the
  // server can generate, or the client refuses to start and mock is untestable.
  const mock = process.env.MOCK_GENERATION === '1';
  const status = providerStatus();

  res.status(200).json({
    mock,
    provider: mock ? 'mock' : status.provider,
    providerLabel: mock ? 'Mock' : status.providerLabel,
    model: mock ? 'mock' : status.model,
    freeTier: mock ? true : status.freeTier,
    configuredProviders: status.configured,
    // Kept under the old name so existing clients keep working.
    apiKeyConfigured: mock || Boolean(status.provider && !status.error),
    providerError: mock ? null : status.error,
    accessCodeRequired: accessCodeRequired(),
    styles: STYLES.slice(0, VARIANT_COUNT).map((s, i) => ({
      index: i,
      name: s.name,
      note: s.note,
    })),
  });
}
