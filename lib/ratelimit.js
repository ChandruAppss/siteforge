/* Best-effort in-process rate limiter.
 *
 * IMPORTANT: on serverless this is per-instance, not global. Vercel may run
 * several instances concurrently, so the real ceiling is roughly
 * (limit x instance count). It raises the cost of casual abuse but it is NOT a
 * hard guarantee — the ACCESS_CODE gate is the actual protection. For a real
 * global limit, back this with Upstash/Vercel KV.
 */

const WINDOW_MS = Number(process.env.RATE_WINDOW_MS) || 60 * 60 * 1000;  // 1 hour
const MAX_PER_WINDOW = Number(process.env.RATE_MAX) || 12;               // per IP per window

const hits = new Map();   // ip -> number[] (timestamps)

/** Vercel puts the caller's IP in x-forwarded-for; fall back to the socket. */
export function clientIp(req) {
  const fwd = req.headers?.['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * @returns {{allowed: boolean, remaining: number, retryAfter: number}}
 */
export function rateLimit(req, now = Date.now()) {
  const ip = clientIp(req);
  const cutoff = now - WINDOW_MS;

  const recent = (hits.get(ip) || []).filter((t) => t > cutoff);

  if (recent.length >= MAX_PER_WINDOW) {
    const retryAfter = Math.ceil((recent[0] + WINDOW_MS - now) / 1000);
    hits.set(ip, recent);
    return { allowed: false, remaining: 0, retryAfter };
  }

  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic cleanup so the Map cannot grow without bound.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      const live = times.filter((t) => t > cutoff);
      if (live.length) hits.set(key, live);
      else hits.delete(key);
    }
  }

  return { allowed: true, remaining: MAX_PER_WINDOW - recent.length, retryAfter: 0 };
}

/** Constant-time-ish compare so the code can't be guessed by timing. */
export function codeMatches(supplied, expected) {
  const a = String(supplied || '');
  const b = String(expected || '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const accessCodeRequired = () => Boolean(process.env.ACCESS_CODE);

export const RATE_LIMIT_INFO = { windowMs: WINDOW_MS, max: MAX_PER_WINDOW };
