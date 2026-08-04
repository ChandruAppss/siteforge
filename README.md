# SiteForge

An AI website-builder landing page with a **working generator** behind it. A visitor types their
business name and a description, and Claude generates six complete, self-contained websites — six
different art directions, not six recolours of one template — which the visitor can preview at
desktop/tablet/mobile widths and download as standalone HTML files.

```
siteforge/
├── api/
│   ├── generate.js        serverless function — generates ONE website
│   └── styles.js          serverless function — lists the design directions
├── lib/
│   ├── generate.js        shared prompt + Claude call + validation
│   └── styles.js          the six art-direction briefs
├── server.js              local dev server (mounts the same api/ handlers)
├── vercel.json            function limits + security headers
└── public/
    ├── index.html         the landing page (13 sections + nav + footer)
    ├── css/styles.css     all styling, responsive down to 390px
    ├── js/app.js          carousel, marquee, FAQ, generation flow
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

The page itself works without a key — only the generator needs one. Check config at `/api/health`.

## Deploying to Vercel

The repo is already shaped the way Vercel expects: `public/` is served statically and each file in
`api/` becomes a function. No build step.

```bash
vercel --prod
```

Then set the key in **Vercel → Project → Settings → Environment Variables**:

| Name | Value |
| --- | --- |
| `ANTHROPIC_API_KEY` | your key |

Redeploy after adding it. Never commit `.env` — it's in `.gitignore` for a reason.

## Configuration

| Variable | Default | What it does |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | — | **Required** for generation. |
| `PORT` | `3000` | Local server port (ignored on Vercel). |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` | `claude-opus-5` gives better sites, slower and pricier. |
| `MAX_TOKENS` | `12000` | Output ceiling per website. |
| `VARIANT_COUNT` | `6` | Websites generated per submission (1–6). Lower it to cut cost. |

## How generation works

The browser asks `GET /api/styles` which design directions to request, then fires one
`POST /api/generate` **per website, in parallel**. Each request generates exactly one site and
returns it.

That shape is deliberate. An earlier version started a job, held it in memory and had the browser
poll for progress — which works locally and breaks on Vercel, because the poll can land on a
different serverless instance that has never heard of the job. One call per website means no shared
state at all, each function stays well inside its execution limit, and a single slow or failed
design doesn't hold up the other five — that card shows an error while the rest render.

The six directions are Modern Minimal, Bold & Vibrant, Elegant Premium, Warm & Friendly, Corporate
Trust and Dark Luxe. Edit `lib/styles.js` to change them.

Generated sites are single self-contained HTML files — inline CSS and JS, Google Fonts allowed, all
imagery drawn with CSS or inline SVG so nothing depends on an external host that could break.

**Cost:** roughly 6 × 8–12k output tokens per submission. Set `VARIANT_COUNT=2` while developing.

**Timeouts:** `vercel.json` sets `maxDuration: 60` — the Hobby ceiling. A large generation can
occasionally exceed it and that card will fail while the others succeed. On a Pro plan you can raise
it to `300`.

## Before you go live

A few things here are deliberately placeholders, not oversights:

- **Testimonials** in `public/js/app.js` are labelled `Sample Customer`. Replace them with real
  quotes you have permission to use — don't ship invented ones attributed to real-sounding people.
- **Stats** in the credibility band (`6,500+ businesses`, `30s`) are illustrative. Make them true or
  remove them.
- **Pricing** in the comparison table is a worked example. The "Other Vendors" column should reflect
  prices you can actually substantiate — inflated competitor figures are a real advertising-law
  problem in most markets, India included.
- **Contact addresses** (`hello@siteforge.example`, `partners@siteforge.example`) need to become
  real inboxes.

The generator's prompt already tells Claude not to fabricate awards, press mentions or named
testimonials for the businesses it writes about, and to use obvious placeholders for details the
owner did not supply.

## Not done yet

- **No auth or rate limiting on `/api/generate`.** Every submission spends real API credit, and the
  endpoint is public the moment you deploy. Add a rate limit (Vercel KV, Upstash) before sharing the
  URL widely.
- No analytics, no persistence — generated sites live only in the browser tab until downloaded.
