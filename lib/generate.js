/* Shared generation logic — used by both the Vercel serverless function
   (api/generate.js) and the local Express dev server (server.js). */

import Anthropic from '@anthropic-ai/sdk';
import { STYLES } from './styles.js';

export const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
// Output length is what drives latency — the model streams at a roughly fixed
// rate, so halving the page halves the wait. 8000 fits the 18KB budget the
// prompt asks for, with headroom.
export const MAX_TOKENS = Number(process.env.MAX_TOKENS) || 8000;

let client = null;
export function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export function buildPrompt(businessName, businessDescription, style) {
  return `You are a senior web designer. Build a complete, production-quality one-page marketing website for this real business.

BUSINESS NAME: ${businessName}

WHAT THE BUSINESS DOES (in the owner's own words):
${businessDescription}

DESIGN DIRECTION — "${style.name}":
${style.brief}

REQUIREMENTS

Content
- Write real, specific marketing copy for THIS business. Read the description carefully and use its actual products, services, specialities and location. Never output "Lorem ipsum" or bracketed placeholders like [Your Service].
- If a detail is genuinely not in the description (a phone number, an exact address, prices), write a natural placeholder that is obviously a placeholder to the owner — e.g. "+91 XXXXX XXXXX" — rather than inventing a fake real-looking value.
- Do not invent awards, press mentions, certifications, partner logos, or named customer testimonials presented as real people. If you include a testimonials section, label it clearly with generic attributions such as "Customer, Pune".
- Indian market context: prices in ₹, phone/WhatsApp call-to-actions, UPI mentioned where a business would take payment.

Structure — include all of these sections
1. Sticky header with the business name and anchor navigation
2. Hero: headline, supporting line, two CTA buttons
3. Trust strip: 3-4 short proof points or stats
4. Services / products: 3-6 cards drawn from the description
5. About: who they are and why they are trusted
6. Gallery or feature showcase (use CSS-drawn visuals, see below)
7. Testimonials (generic attributions only)
8. FAQ: 4-6 questions a real customer of this business would ask
9. Contact section with a form (name, phone, message) and WhatsApp + call buttons
10. Footer with nav, hours if relevant, and copyright

Technical
- Output ONE complete self-contained HTML file: <!DOCTYPE html> through </html>.
- All CSS in a single <style> block in <head>. All JS, if any, in one <script> before </body>.
- Google Fonts via <link> is allowed. NO other external resources.
- NO external images. Do not reference any image URL or any placeholder image service — they will not load. Create all visuals with CSS gradients, CSS shapes, or inline SVG you write yourself. Inline SVG icons only.
- Fully responsive: works at 390px, 768px and 1280px. Use clamp() for type.
- Accessible: semantic landmarks, alt text on inline SVG via aria-label, visible focus states, WCAG AA contrast.
- Include smooth scrolling for anchor links, a working mobile nav toggle, and a scroll-reveal animation using IntersectionObserver. Respect prefers-reduced-motion.
- The contact form must not post anywhere — preventDefault and show an inline thank-you message.

Length — this matters
- Keep the whole file UNDER 18KB. This is a hard budget, not a suggestion.
- Spend it on content, not CSS. Write tight, well-chosen styles; do not restate defaults, do not write long utility ladders, do not repeat rules that could be one selector.
- Keep each section to what earns its place. Two strong sentences beat six weak ones.

OUTPUT
Return ONLY the raw HTML. No markdown code fences, no commentary before or after. Start with <!DOCTYPE html>.`;
}

/* Strip markdown fences the model may add despite instructions. */
export function cleanHtml(raw) {
  let html = (raw || '').trim();

  const fence = html.match(/^```(?:html)?\s*\n([\s\S]*?)\n?```$/i);
  if (fence) html = fence[1].trim();

  // Drop any preamble before the doctype / opening html tag.
  const start = html.search(/<!DOCTYPE html|<html[\s>]/i);
  if (start > 0) html = html.slice(start);

  return html.trim();
}

/**
 * Generate one website, emitting text as the model produces it.
 *
 * Total time is the same as the non-streaming call — the win is that the
 * browser can paint a partial page within a couple of seconds instead of
 * showing a spinner for a minute and a half.
 *
 * @param {(chunk:string)=>void} onChunk called with each text delta
 * @returns {Promise<{style:string, styleNote:string, html:string}>}
 */
export async function streamWebsite({ businessName, businessDescription, styleIndex, onChunk }) {
  const style = STYLES[styleIndex];
  if (!style) throw new Error(`Unknown style index: ${styleIndex}`);

  // MOCK_GENERATION=1 streams a canned page so the streaming plumbing can be
  // exercised locally without an API key (and without spending credit).
  if (process.env.MOCK_GENERATION === '1') {
    const html = mockPage(businessName, style);
    const delay = Number(process.env.MOCK_DELAY_MS) || 60;
    for (let i = 0; i < html.length; i += 400) {
      onChunk?.(html.slice(i, i + 400));
      await new Promise((r) => setTimeout(r, delay));
    }
    return { style: style.name, styleNote: style.note, html };
  }

  const anthropic = getClient();
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY is not set on the server.');

  let raw = '';

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 1,
    messages: [
      { role: 'user', content: buildPrompt(businessName, businessDescription, style) },
    ],
  });

  stream.on('text', (text) => {
    raw += text;
    if (onChunk) onChunk(text);
  });

  await stream.finalMessage();

  const html = cleanHtml(raw);
  if (!/<html[\s>]/i.test(html) || html.length < 800) {
    throw new Error('The model did not return a complete HTML document.');
  }

  return { style: style.name, styleNote: style.note, html };
}

/**
 * Generate one website. Throws on failure so the caller decides how to report it.
 * @returns {Promise<{style:string, styleNote:string, html:string}>}
 */
export async function generateWebsite({ businessName, businessDescription, styleIndex }) {
  const anthropic = getClient();
  if (!anthropic) {
    throw new Error('ANTHROPIC_API_KEY is not set on the server.');
  }

  const style = STYLES[styleIndex];
  if (!style) throw new Error(`Unknown style index: ${styleIndex}`);

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 1,
    messages: [
      { role: 'user', content: buildPrompt(businessName, businessDescription, style) },
    ],
  });

  const raw = msg.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const html = cleanHtml(raw);

  if (!/<html[\s>]/i.test(html) || html.length < 800) {
    throw new Error('The model did not return a complete HTML document.');
  }

  return { style: style.name, styleNote: style.note, html };
}

/** Canned page for MOCK_GENERATION. Deliberately dull — it exists to prove
    bytes flow end to end, not to look like a real result. */
function mockPage(businessName, style) {
  const rows = Array.from({ length: 14 }, (_, i) =>
    `  <section><h2>Section ${i + 1}</h2><p>Placeholder copy for ${businessName} in the ${style.name} direction. This text exists only to give the stream something to carry.</p></section>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${businessName} — mock</title>
<style>
body{font-family:system-ui,sans-serif;margin:0;padding:40px;line-height:1.6;color:#222}
h1{font-size:44px;margin:0 0 8px}
h2{font-size:22px;margin:32px 0 6px;color:#550cca}
section{border-top:1px solid #eee;padding-top:8px}
</style>
</head>
<body>
<h1>${businessName}</h1>
<p><strong>${style.name}</strong> — MOCK OUTPUT, not generated by Claude.</p>
${rows}
</body>
</html>`;
}

/** Shared input validation for both entry points. */
export function validateInput(body) {
  const businessName = String(body?.businessName || '').trim().slice(0, 80);
  const businessDescription = String(body?.businessDescription || '').trim().slice(0, 1200);
  const styleIndex = Number(body?.styleIndex);

  if (!businessName) return { error: 'businessName is required' };
  if (businessDescription.length < 20) {
    return { error: 'businessDescription must be at least 20 characters' };
  }
  if (!Number.isInteger(styleIndex) || styleIndex < 0 || styleIndex >= STYLES.length) {
    return { error: 'styleIndex must be a valid style index' };
  }

  return { businessName, businessDescription, styleIndex };
}
