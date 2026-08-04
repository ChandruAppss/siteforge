/* Diagnostic: measures the function execution ceiling actually in force.
 *
 * GET /api/ping?ms=25000 sleeps then reports. If it returns, the limit is
 * above that; if it 504s, the limit is below. Useful because a maxDuration
 * that is silently clamped or not applied is otherwise invisible until a real
 * generation times out.
 *
 * Costs nothing and needs no access code. Sleep is capped so it can't be used
 * to tie up capacity.
 */

export const config = {
  maxDuration: 300,
};

const MAX_SLEEP_MS = 60_000;

export default async function handler(req, res) {
  const requested = Number(req.query?.ms) || 0;
  const ms = Math.min(Math.max(requested, 0), MAX_SLEEP_MS);

  const started = Date.now();
  if (ms) await new Promise((r) => setTimeout(r, ms));
  const elapsed = Date.now() - started;

  res.status(200).json({
    ok: true,
    requestedMs: requested,
    sleptMs: elapsed,
    note: 'If you see this, the function ran at least this long without being killed.',
  });
}
