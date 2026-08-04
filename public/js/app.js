/* ==========================================================================
   SiteForge — landing page behaviour + AI generation flow
   ========================================================================== */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ─────────────────────────────────────────────────────────────────────
     Content data
     ───────────────────────────────────────────────────────────────────── */

  // All editable copy, pricing, stats and quotes live in js/content.js so
  // there is exactly one place to swap placeholders for real data.
  const C = window.SITEFORGE_CONTENT || {};
  const TESTIMONIALS = (C.testimonials?.show === false ? [] : C.testimonials?.items) || [];
  const MARQUEE = (C.marquee?.show === false ? [] : C.marquee?.items) || [];
  const FAQS = C.faqs || [];

  /* ─────────────────────────────────────────────────────────────────────
     Render: testimonials
     ───────────────────────────────────────────────────────────────────── */
  const initials = (s) => s.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  function renderTestimonials() {
    const track = $('#testiTrack');
    if (!track) return;

    // No quotes configured (or switched off) — drop the whole section rather
    // than leave an empty heading behind.
    if (!TESTIMONIALS.length) {
      const section = $('#trust');
      if (section) section.hidden = true;
      return;
    }

    track.innerHTML = TESTIMONIALS.map(t => `
      <article class="testi-card">
        <div class="testi-stars" aria-label="5 out of 5">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="testi-quote">&ldquo;${t.q}&rdquo;</p>
        <div class="testi-who">
          <div class="testi-avatar" aria-hidden="true">${initials(t.n)}</div>
          <div>
            <div class="testi-name">${t.n}</div>
            <div class="testi-biz">${t.b}</div>
          </div>
        </div>
      </article>`).join('');

    const dots = $('#testiDots');
    // clientWidth is 0 while the page is in a hidden/zero-size container, which
    // would make this divide by zero — clamp to something sane.
    const pages = () => {
      const w = track.clientWidth;
      if (!w) return 1;
      return Math.min(TESTIMONIALS.length, Math.max(1, Math.ceil(track.scrollWidth / w)));
    };

    function buildDots() {
      const n = pages();
      if (dots.childElementCount === n) return;   // count unchanged, leave it alone
      dots.innerHTML = Array.from({ length: n },
        (_, i) => `<button class="testi-dot${i === 0 ? ' is-active' : ''}" aria-label="Go to page ${i + 1}"></button>`).join('');
      $$('.testi-dot', dots).forEach((d, i) => {
        d.addEventListener('click', () => track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' }));
      });
      syncDots();
    }

    function syncDots() {
      const w = track.clientWidth;
      if (!w) return;
      const idx = Math.round(track.scrollLeft / w);
      $$('.testi-dot', dots).forEach((d, i) => d.classList.toggle('is-active', i === idx));
    }

    buildDots();
    track.addEventListener('scroll', syncDots, { passive: true });

    // The track's width changes with the viewport and again when the webfont
    // lands. A window 'resize' handler misses both (it can fire before layout
    // settles, and not at all for programmatic resizes) — observe the box.
    new ResizeObserver(buildDots).observe(track);

    $('#testiPrev').addEventListener('click', () => track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' }));
    $('#testiNext').addEventListener('click', () => track.scrollBy({ left: track.clientWidth, behavior: 'smooth' }));
  }

  /* ─────────────────────────────────────────────────────────────────────
     Render: logo marquee (duplicated once so the -50% loop is seamless)
     ───────────────────────────────────────────────────────────────────── */
  function renderMarquee() {
    const item = ([name, cat, color]) => `
      <div class="mq-item">
        <span class="mq-mark" style="background:${color}">${name[0]}</span>
        <span><span class="mq-name">${name}</span><br><span class="mq-cat">${cat}</span></span>
      </div>`;

    if (!MARQUEE.length) {
      const section = $('#logolistcarsel');
      if (section) section.hidden = true;
      return;
    }

    const a = $('#marqueeA'), b = $('#marqueeB');
    if (a) a.innerHTML = [...MARQUEE, ...MARQUEE].map(item).join('');
    if (b) b.innerHTML = [...MARQUEE.slice().reverse(), ...MARQUEE.slice().reverse()].map(item).join('');
  }

  /* ─────────────────────────────────────────────────────────────────────
     Render: price comparison table
     ───────────────────────────────────────────────────────────────────── */
  function renderPricing() {
    const table = $('#priceTable');
    const p = C.pricing;
    if (!table || !p) return;

    const showCmp = p.showComparison !== false;
    table.classList.toggle('no-comparison', !showCmp);

    const cell2 = (v) => showCmp ? `<div class="pt-c2"><s>${escapeHtml(v)}</s></div>` : '';

    const rows = p.groups.map(g => `
      <div class="pt-group">${escapeHtml(g.title)}</div>
      ${g.rows.map(r => `
        <div class="pt-row">
          <div class="pt-c1">${escapeHtml(r.feature)}</div>
          ${cell2(r.separate)}
          <div class="pt-c3 ${r.kind === 'free' ? 'pt-free' : 'pt-inc'}">${escapeHtml(r.ours)}</div>
        </div>`).join('')}`).join('');

    table.innerHTML = `
      <div class="pt-head">
        <div class="pt-c1">Features</div>
        ${showCmp ? '<div class="pt-c2">Bought separately</div>' : ''}
        <div class="pt-c3">SiteForge</div>
      </div>
      ${rows}
      <div class="pt-row pt-total">
        <div class="pt-c1">Total / Year</div>
        ${cell2(p.total.separate)}
        <div class="pt-c3">${escapeHtml(p.total.ours)}</div>
      </div>`;

    const note = $('#priceNote');
    if (note) {
      note.textContent = showCmp ? (p.comparisonNote || '') : '';
      note.hidden = !showCmp;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────
     Render: stats band + customer count + contact links
     ───────────────────────────────────────────────────────────────────── */
  function renderStats() {
    const grid = $('#credGrid');
    const s = C.stats;
    if (!grid || !s) return;

    if (s.show === false || !s.items?.length) {
      const section = $('#awards');
      if (section) section.hidden = true;
      return;
    }

    grid.innerHTML = s.items.map(i => `
      <div class="cred-card">
        <div class="cred-stat">${escapeHtml(i.value)}</div>
        <div class="cred-label">${escapeHtml(i.label)}</div>
      </div>`).join('');
  }

  function renderCustomerCount() {
    const count = C.customerCount;
    $$('[data-customer-count]').forEach(el => {
      // Hide the whole line when there is no number worth claiming.
      if (!count) { el.hidden = true; return; }
      el.textContent = count;
    });
    if (!count) $$('[data-customer-count-wrap]').forEach(el => el.hidden = true);
  }

  function renderContact() {
    const c = C.contact || {};
    $$('[data-mailto]').forEach(el => {
      const key = el.dataset.mailto;
      const addr = c[key];
      if (!addr) return;
      el.href = `mailto:${addr}`;
      if (el.dataset.mailtoText !== 'keep') el.textContent = addr;
    });
    $$('[data-support-hours]').forEach(el => {
      if (c.supportHours) el.textContent = c.supportHours;
    });
  }

  /* ─────────────────────────────────────────────────────────────────────
     Render: FAQ accordion
     ───────────────────────────────────────────────────────────────────── */
  function renderFaq() {
    const acc = $('#faqAccordion');
    if (!acc) return;

    acc.innerHTML = FAQS.map(([q, a], i) => `
      <div class="accordion-item">
        <h3><button class="accordion-button" type="button" aria-expanded="false" aria-controls="faq-p-${i}">${q}</button></h3>
        <div class="accordion-panel" id="faq-p-${i}"><div><div class="accordion-body">${a}</div></div></div>
      </div>`).join('');

    acc.addEventListener('click', (e) => {
      const btn = e.target.closest('.accordion-button');
      if (!btn) return;
      const item = btn.closest('.accordion-item');
      const open = item.classList.contains('is-open');

      // single-open accordion
      $$('.accordion-item', acc).forEach(it => {
        it.classList.remove('is-open');
        $('.accordion-button', it).setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────────────
     Sticky CTA + smooth scroll + year
     ───────────────────────────────────────────────────────────────────── */
  function initChrome() {
    const sticky = $('#stickyCta');
    const hero = $('.hero-section');

    if (sticky && hero) {
      const io = new IntersectionObserver(
        ([entry]) => sticky.classList.toggle('visible', !entry.isIntersecting),
        { rootMargin: '-120px 0px 0px 0px' }
      );
      io.observe(hero);
    }

    // Focus the first field when a "Try for FREE" link jumps to the form
    $$('.js-scroll').forEach(link => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || !id.startsWith('#') || id === '#') return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (id === '#generator') setTimeout(() => $('#businessName').focus(), 480);
      });
    });

    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ─────────────────────────────────────────────────────────────────────
     AI generation flow
     ───────────────────────────────────────────────────────────────────── */
  const overlay = $('#genOverlay');
  const elLoading = $('#genLoading');
  const elResults = $('#genResults');
  const elErrorState = $('#genErrorState');
  const elGrid = $('#genGrid');
  const elBar = $('#genBar');
  const elStatus = $('#genStatus');
  const elSteps = $('#genSteps');

  const STEP_LABELS = [
    'Reading your business details',
    'Choosing six design directions',
    'Writing your copy and sections',
    'Assembling the pages',
    'Final polish',
  ];

  let variants = [];          // one entry per design direction
  let previewIndex = -1;
  let runToken = 0;           // bumped per run so a stale run can't touch the UI

  function openOverlay(state) {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    elLoading.hidden = state !== 'loading';
    elResults.hidden = state !== 'results';
    elErrorState.hidden = state !== 'error';
  }

  function closeOverlay() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    runToken++;               // abandon any in-flight run
  }

  function renderSteps(activeIdx) {
    elSteps.innerHTML = STEP_LABELS.map((label, i) => {
      const cls = i < activeIdx ? 'is-done' : i === activeIdx ? 'is-active' : '';
      const mark = i < activeIdx ? '&#10003;' : i + 1;
      return `<div class="gen-step ${cls}"><span class="gen-step-mark">${mark}</span><span>${label}</span></div>`;
    }).join('');
  }

  function showError(msg) {
    runToken++;
    $('#genErrorMsg').textContent = msg;
    openOverlay('error');
  }

  /* Each website is its own request. That keeps every serverless invocation
     short and stateless — there is no job to look up on a second instance —
     and one slow or failed design does not hold up the other five. */
  async function startGeneration(businessName, businessDescription) {
    const token = ++runToken;

    variants = [];
    elGrid.innerHTML = '';
    $('#genBizName').textContent = businessName;
    elBar.style.width = '4%';
    elStatus.textContent = 'Sending your details to the AI…';
    renderSteps(0);
    openOverlay('loading');

    // Ask the server which design directions to request.
    let styles;
    try {
      const res = await fetch('/api/styles');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load design styles');
      if (!data.apiKeyConfigured) {
        throw new Error('The server has no ANTHROPIC_API_KEY configured, so it cannot generate websites yet.');
      }
      styles = data.styles || [];
      if (!styles.length) throw new Error('The server returned no design styles.');
    } catch (err) {
      if (token !== runToken) return;
      showError(err.message === 'Failed to fetch'
        ? 'Could not reach the server. Check that it is running, then try again.'
        : err.message);
      return;
    }

    if (token !== runToken) return;

    variants = styles.map(s => ({
      style: s.name, styleNote: s.note, businessName,
      status: 'pending', html: null, error: null,
    }));

    // Build the grid now, but stay on the progress view until the first design
    // actually lands — there is nothing worth looking at before that.
    renderVariants();

    const total = variants.length;
    let settled = 0;

    const updateProgress = () => {
      const ready = variants.filter(v => v.status === 'ready').length;
      elBar.style.width = Math.min(100, 8 + Math.round((settled / total) * 92)) + '%';
      renderSteps(Math.min(STEP_LABELS.length - 1, Math.floor((settled / total) * STEP_LABELS.length)));
      elStatus.textContent = `${ready} of ${total} websites ready…`;
    };

    const accessCode = ($('#accessCode')?.value || '').trim();

    await Promise.all(styles.map(async (s, i) => {
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessName, businessDescription, styleIndex: s.index, accessCode }),
        });
        const data = await res.json().catch(() => ({}));

        // A bad code or a rate limit applies to the whole run, not one design —
        // stop everything and say so once instead of six identical card errors.
        if (res.status === 401 || res.status === 429) {
          if (token === runToken) {
            revealAccessCode();
            showError(data.error || 'Access denied.');
          }
          throw new Error(data.error || 'Access denied');
        }

        if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

        if (token !== runToken) return;
        variants[i].status = 'ready';
        variants[i].html = data.html;
      } catch (err) {
        if (token !== runToken) return;
        variants[i].status = 'failed';
        variants[i].error = err.message === 'Failed to fetch'
          ? 'Lost connection to the server'
          : err.message;
      } finally {
        if (token === runToken) {
          settled++;
          updateProgress();
          // First design in: swap the progress view for the results grid so the
          // user can start browsing while the rest are still being written.
          if (elResults.hidden && variants.some(v => v.status === 'ready')) {
            openOverlay('results');
          }
          renderVariants();
        }
      }
    }));

    if (token !== runToken) return;

    elBar.style.width = '100%';
    if (!variants.some(v => v.status === 'ready')) {
      showError('Every design failed to generate. Check the server logs and your API key, then try again.');
    }
  }

  function renderVariants() {
    elGrid.innerHTML = variants.map((v, i) => {
      if (v.status === 'ready') {
        return `
          <div class="gen-card">
            <div class="gen-card-thumb">
              <iframe title="${escapeAttr(v.style)} preview" sandbox="allow-same-origin"
                      srcdoc="${escapeAttr(v.html)}" loading="lazy"></iframe>
            </div>
            <div class="gen-card-body">
              <div class="gen-card-style">${escapeHtml(v.style)}</div>
              <div class="gen-card-desc">${escapeHtml(v.styleNote || '')}</div>
              <div class="gen-card-actions">
                <button class="btn btn-primary" data-preview="${i}">Preview</button>
                <button class="btn btn-ghost" data-download="${i}">Download</button>
              </div>
            </div>
          </div>`;
      }
      if (v.status === 'failed') {
        return `
          <div class="gen-card">
            <div class="gen-card-thumb is-pending">
              <div class="gen-card-failed">This design failed to generate.<br><small>${escapeHtml(v.error || '')}</small></div>
            </div>
            <div class="gen-card-body">
              <div class="gen-card-style">${escapeHtml(v.style)}</div>
              <div class="gen-card-desc">Not available</div>
            </div>
          </div>`;
      }
      return `
        <div class="gen-card">
          <div class="gen-card-thumb is-pending"><div class="gen-thumb-skeleton"></div></div>
          <div class="gen-card-body">
            <div class="gen-card-style">${escapeHtml(v.style)}</div>
            <div class="gen-card-desc">Designing…</div>
          </div>
        </div>`;
    }).join('');
  }

  const escapeHtml = (s = '') => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const escapeAttr = (s = '') => String(s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ── Fullscreen preview ─────────────────────────────────────────────── */
  const previewOverlay = $('#previewOverlay');
  const previewFrame = $('#previewFrame');

  function openPreview(i) {
    const v = variants[i];
    if (!v || v.status !== 'ready') return;
    previewIndex = i;
    $('#previewName').textContent = v.style;
    previewFrame.srcdoc = v.html;
    previewOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closePreview() {
    previewOverlay.hidden = true;
    previewFrame.srcdoc = '';
    if (overlay.hidden) document.body.style.overflow = '';
  }

  function download(i) {
    const v = variants[i];
    if (!v || v.status !== 'ready') return;
    const blob = new Blob([v.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug(v.businessName || 'website')}-${slug(v.style)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'site';

  /* Ask the server once on load whether it needs an access code, so the field
     is already present rather than appearing after a failed submit. */
  async function probeServer() {
    try {
      const res = await fetch('/api/styles');
      if (!res.ok) return;
      const data = await res.json();
      if (data.accessCodeRequired) revealAccessCode();
    } catch { /* offline / server down — the submit path reports that properly */ }
  }

  function revealAccessCode() {
    const wrap = $('#accessCodeWrap');
    if (wrap) wrap.hidden = false;
  }

  /* ─────────────────────────────────────────────────────────────────────
     Wiring
     ───────────────────────────────────────────────────────────────────── */
  function initGenerator() {
    const form = $('#generateForm');
    const nameEl = $('#businessName');
    const descEl = $('#businessDescription');
    const errEl = $('#formError');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = nameEl.value.trim();
      const desc = descEl.value.trim();

      nameEl.classList.remove('is-invalid');
      descEl.classList.remove('is-invalid');
      errEl.hidden = true;

      if (!name) {
        nameEl.classList.add('is-invalid');
        errEl.textContent = 'Please enter your business name.';
        errEl.hidden = false;
        nameEl.focus();
        return;
      }
      if (desc.length < 20) {
        descEl.classList.add('is-invalid');
        errEl.textContent = 'Tell us a bit more — at least a sentence about what you do (20+ characters).';
        errEl.hidden = false;
        descEl.focus();
        return;
      }

      startGeneration(name, desc);
    });

    $('#genClose').addEventListener('click', closeOverlay);
    $('#genRestart').addEventListener('click', () => { closeOverlay(); nameEl.focus(); });
    $('#genRetry').addEventListener('click', () => {
      startGeneration(nameEl.value.trim(), descEl.value.trim());
    });

    elGrid.addEventListener('click', (e) => {
      const p = e.target.closest('[data-preview]');
      if (p) return openPreview(Number(p.dataset.preview));
      const d = e.target.closest('[data-download]');
      if (d) return download(Number(d.dataset.download));
    });

    $('#previewClose').addEventListener('click', closePreview);
    $('#previewDownload').addEventListener('click', () => download(previewIndex));

    $$('.preview-size').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.preview-size').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        previewFrame.style.width = btn.dataset.w;
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!previewOverlay.hidden) closePreview();
      else if (!overlay.hidden) closeOverlay();
    });

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
  }

  /* ── Go ─────────────────────────────────────────────────────────────── */
  renderPricing();
  renderStats();
  renderCustomerCount();
  renderContact();
  renderTestimonials();
  renderMarquee();
  renderFaq();
  initChrome();
  initGenerator();
  probeServer();
})();
