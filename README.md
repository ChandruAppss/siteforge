# SiteForge

An AI website-builder landing page with a **working generator** behind it. A visitor types their
business name and a description, and Claude generates six complete, self-contained websites — six
different art directions, not six recolours of one template — which the visitor can preview at
desktop/tablet/mobile widths and download as standalone HTML files.

```
siteforge/
├── api/
│   ├── generate.js        serverless function — generates ONE website
│   └── styles.js          serverless function — lists design directions + server state
├── lib/
│   ├── generate.js        shared prompt + Claude call + validation
│   ├── styles.js          the six art-direction briefs
│   └── ratelimit.js       access-code check + per-IP limit
├── server.js              local dev server (mounts the same api/ handlers)
├── vercel.json            function limits + security headers
└── public/
    ├── index.html         the landing page
    ├── privacy.html       ┐
    ├── terms.html         ├ legal pages (templates — see below)
    ├── refund.html        ┘
    ├── css/styles.css     all styling, responsive down to 390px
    ├── js/content.js      ← ALL editable copy, pricing, stats and quotes
    ├── js/app.js          rendering + generation flow
    ├── js/legal.js        contact/year fill-in for the legal pages
    └── img/               logo + favicon (SVG)
```

## Running locally

```bash
cd siteforge && npm install
```

Add your API key — get one at <https://console.anthropic.com/settings/keys>:

```bash
cp .env.example .env
```

Open `.env`, set `ANTHROPIC_API_KEY`, then:

```bash
npm start
```

Open <http://localhost:3000>. `npm run dev` auto-restarts on changes.

The page works without a key — only the generator needs one. Check server state at `/api/health`.

## Deploying to Vercel

`public/` is served statically and each file in `api/` becomes a function. No build step.

```bash
vercel --prod --yes
```

Set the key in **Vercel → Project → Settings → Environment Variables**, then redeploy. Never commit
`.env`.

## Configuration

| Variable | Default | What it does |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | — | **Required** for generation. |
| `PORT` | `3000` | Local server port (ignored on Vercel). |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` | `claude-opus-5` gives better sites, slower and pricier. |
| `MAX_TOKENS` | `12000` | Output ceiling per website. |
| `VARIANT_COUNT` | `6` | Websites per submission (1–6). Lower it to cut cost. |
| `ACCESS_CODE` | unset | If set, the generator refuses to run without it. |
| `RATE_MAX` | `12` | Generations allowed per IP per window. |
| `RATE_WINDOW_MS` | `3600000` | The window, in ms (1 hour). |

## Abuse protection

`/api/generate` is public and every call spends real API credit. Two gates sit in front of it:

**`ACCESS_CODE`** — the real protection. Set it and the form grows an access-code field
automatically (the browser asks `/api/styles` on load whether one is needed). Requests without a
matching code get a 401 before any Claude call happens. Comparison is constant-time so the code
can't be guessed by timing.

**Per-IP rate limit** — best-effort only. On serverless this is enforced *per instance*, not
globally, so the true ceiling is roughly `RATE_MAX × live instance count`. It raises the cost of
casual abuse; it is not a guarantee. For a hard global limit, back `lib/ratelimit.js` with Upstash
or Vercel KV.

A 401 or 429 aborts the whole run and reports once, rather than showing six identical card errors.

## How generation works

The browser asks `GET /api/styles` which directions to request, then fires one `POST /api/generate`
**per website, in parallel**. Each request generates exactly one site and returns it.

That shape is deliberate. An earlier version started a job, held it in memory and had the browser
poll for progress — which works locally and breaks on Vercel, because the poll can land on a
different serverless instance that has never heard of the job. One call per website means no shared
state, each function stays well inside its execution limit, and a single slow or failed design
doesn't hold up the other five — that card shows an error while the rest render.

The six directions are Modern Minimal, Bold & Vibrant, Elegant Premium, Warm & Friendly, Corporate
Trust and Dark Luxe. Edit `lib/styles.js` to change them.

Generated sites are single self-contained HTML files — inline CSS and JS, Google Fonts allowed, all
imagery drawn with CSS or inline SVG so nothing depends on an external host that could break.

**Cost:** roughly 6 × 8–12k output tokens per submission. Set `VARIANT_COUNT=2` while developing.

**Timeouts:** `vercel.json` sets `maxDuration: 60`, the Hobby ceiling. A large generation can
occasionally exceed it and that one card fails while the others succeed. Raise to `300` on Pro.

## ⚠ Placeholder content you must replace

Everything that makes a factual claim lives in **`public/js/content.js`**, marked
`⚠ PLACEHOLDER`. None of it is real data. Each block has a `show` flag so you can switch a section
off rather than publish something untrue.

| In `content.js` | Why it matters |
| --- | --- |
| `contact` | `.example` domains don't exist. Use real inboxes. |
| `pricing.groups[].separate` | A side-by-side price comparison is advertising you can be asked to substantiate. India's ASCI code treats unsupported comparative claims as misleading. Use figures you have evidence for, or set `pricing.showComparison: false` to drop the column and sell on your own price. |
| `stats.items` | Invented. A launch-day product has no customer count. Items are tagged `real: true/false` — the false ones need replacing or removing. |
| `customerCount` | Same. Set to `null` to hide both places it appears. |
| `testimonials.items` | Written examples, deliberately labelled "Sample Customer". Publishing invented quotes attributed to real-sounding people is straightforwardly deceptive. |
| `marquee.items` | Invented business names. Never list real companies unless they're customers who agreed to be named. |
| `faqs` | These are promises. Make sure each is true of your actual service. |

The generator's prompt separately tells Claude not to fabricate awards, press mentions or named
testimonials for the businesses *it* writes about, and to use obvious placeholders for details the
owner didn't supply.

## ⚠ Legal pages are templates

`privacy.html`, `terms.html` and `refund.html` are starting templates, **not legal advice, not
lawyer-reviewed**. The privacy policy does accurately describe what this code does today (form text
goes to Anthropic's API; no accounts; no database; IP used for rate limiting; no cookies or
trackers). The terms and refund pages make commercial promises you have to actually honour — the
homepage advertises a 100% refund guarantee, so the refund page has to match.

Each carries a visible template notice and `noindex`. Have them reviewed, then remove the notice and
the `noindex` tag.

## Not done yet

- No analytics, no persistence — generated sites live only in the browser tab until downloaded.
- No payment flow. The pricing table is presentation only; nothing charges anyone.
- Rate limiting is per-instance (see above).
