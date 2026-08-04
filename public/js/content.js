/* ==========================================================================
   SiteForge — editable content
   ==========================================================================
   Everything on the page that makes a factual claim lives here. Change it in
   this one file; nothing else needs touching.

   Items marked  ⚠ PLACEHOLDER  are NOT real data. They are shaped like real
   data so the layout looks right, but you must replace them with figures and
   quotes you can actually stand behind before you drive traffic here.
   ========================================================================== */

window.SITEFORGE_CONTENT = {

  /* ── Contact ────────────────────────────────────────────────────────────
     ⚠ PLACEHOLDER — .example domains do not exist. Use real inboxes. */
  contact: {
    general: 'hello@siteforge.example',
    partners: 'partners@siteforge.example',
    supportHours: 'Mon–Sat, 10am–7pm IST',
  },

  /* ── Pricing ────────────────────────────────────────────────────────────
     `separate` is what you claim these cost bought individually.

     ⚠ These are illustrative numbers, not researched market prices. In India
     (and most markets) a side-by-side price comparison is advertising you can
     be asked to substantiate — the ASCI code treats unsupported comparative
     claims as misleading. Either put in figures you have evidence for, or set
     `showComparison: false` below to drop the "bought separately" column and
     sell on your own price alone. */
  pricing: {
    // OFF until the "bought separately" figures are ones you can evidence.
    // Turning this on also brings back the "Save ₹X" claims below, which are
    // derived from it — the saving is only true if the comparison is true.
    showComparison: false,

    // The headline saving shown in the navbar, hero and above the price table.
    // null hides all three. Set it to a string (e.g. '₹20,000') only when
    // showComparison is true and the arithmetic actually holds.
    savingsClaim: null,

    monthly: '₹299',
    annual: '₹3,999',
    storeAddon: '₹250',
    currency: '₹',
    comparisonNote: 'Estimated cost of buying each item separately.',
    groups: [
      {
        title: 'Complete Website',
        rows: [
          { feature: 'Website design & build', separate: '₹12,000', ours: '₹3,999', kind: 'included' },
          { feature: 'Domain name (annual plan)', separate: '₹999', ours: 'FREE', kind: 'free' },
          { feature: 'Hosting, SSL & CDN', separate: '₹1,200', ours: 'FREE', kind: 'free' },
          { feature: 'Unlimited edits & support', separate: '₹1,800', ours: 'FREE', kind: 'free' },
          { feature: 'Logo & brand kit', separate: '₹1,500', ours: 'FREE', kind: 'free' },
        ],
      },
      {
        title: 'Get More Sales',
        rows: [
          { feature: 'AI SEO toolkit', separate: '₹3,000', ours: 'FREE', kind: 'free' },
          { feature: 'Lead capture forms', separate: '₹1,000', ours: 'FREE', kind: 'free' },
          { feature: 'WhatsApp, call & email buttons', separate: '₹600', ours: 'FREE', kind: 'free' },
          { feature: 'UPI & QR payments', separate: '₹500', ours: 'FREE', kind: 'free' },
          { feature: 'Multi-language pages', separate: '₹2,000', ours: 'FREE', kind: 'free' },
        ],
      },
      {
        title: 'Growth Marketing',
        rows: [
          { feature: 'Built-in CRM', separate: '₹700', ours: 'FREE', kind: 'free' },
          { feature: 'AI writer & social posts', separate: '₹3,000', ours: 'FREE', kind: 'free' },
          { feature: 'Analytics & ads integration', separate: '₹2,500', ours: 'FREE', kind: 'free' },
        ],
      },
    ],
    total: { separate: '₹30,799', ours: '₹3,999 ONLY!' },
  },

  /* ── Headline stats ─────────────────────────────────────────────────────
     ⚠ PLACEHOLDER — every one of these is invented. A launch-day product has
     no customer count. Put in your real numbers, or set `show: false` and the
     band renders with the honest ones only. */
  stats: {
    show: true,   // section stays — three of the four claims are true
    items: [
      // Measured: one website takes ~97s, six run in parallel, so wall-clock is
      // roughly two minutes. Re-measure if the prompt or MAX_TOKENS changes.
      { value: '~2 min', label: 'From your description to six finished websites', real: true },
      { value: '6,500+', label: 'Businesses building on SiteForge', real: false },
      { value: '6', label: 'Free custom websites before you pay', real: true },
      { value: '100%', label: 'Refund guarantee, no questions asked', real: true },
    ],
  },

  /* Shown next to the hero and above the testimonials.
     null until there is a real number to put here. */
  customerCount: null,

  /* ── Testimonials ───────────────────────────────────────────────────────
     ⚠ PLACEHOLDER — these are written examples, not real customers. Publishing
     invented quotes attributed to real-sounding people is straightforwardly
     deceptive, so they are deliberately labelled "Sample Customer". Replace
     them with quotes you have permission to use, or set `show: false`. */
  testimonials: {
    show: false,   // hidden until there are real quotes to publish
    items: [
      { q: 'Clinic online instantly. Patients find us on search now.', n: 'Sample Customer', b: 'Dental clinic, Pune' },
      { q: 'Easy website, and it actually brings in enquiries.', n: 'Sample Customer', b: 'Staffing firm, Chennai' },
      { q: 'Fast AI creation. Went live the same evening.', n: 'Sample Customer', b: 'Handmade crafts, Nashik' },
      { q: 'Easy to showcase the menu and receive orders.', n: 'Sample Customer', b: 'Catering, Hyderabad' },
      { q: 'The online store expanded us to other cities.', n: 'Sample Customer', b: 'Home bakery, Mumbai' },
      { q: 'Getting B2B orders straight from the website.', n: 'Sample Customer', b: 'Food brand, Bengaluru' },
      { q: 'It brings our journey and our work together in one place.', n: 'Sample Customer', b: 'Fashion label, Jaipur' },
      { q: 'AI made it effortless for a non-technical person like me.', n: 'Sample Customer', b: 'Snacks brand, Indore' },
      { q: 'Easiest thing to update daily, and orders come in.', n: 'Sample Customer', b: 'Baking studio, Kolkata' },
      { q: 'Scaling our customer reach and branding together.', n: 'Sample Customer', b: 'Art studio, Pune' },
      { q: 'The website helps us show that we are genuine.', n: 'Sample Customer', b: 'Health services, Bengaluru' },
      { q: 'Within days of launch we had orders beyond our city.', n: 'Sample Customer', b: 'Jewellery, Nagpur' },
    ],
  },

  /* ── Logo marquee ───────────────────────────────────────────────────────
     ⚠ PLACEHOLDER — invented business names. Do NOT put real companies here
     unless they are actually customers and have agreed to be named. */
  marquee: {
    show: false,   // hidden until these are real, consenting customers
    items: [
      ['Bliss Studio', 'Salon', '#6a2bf3'], ['NorthCraft', 'Furniture', '#0ea5e9'],
      ['GreenLeaf', 'Organic', '#12a150'], ['UrbanBite', 'Cafe', '#f59e0b'],
      ['Vaidya Care', 'Clinic', '#ef4444'], ['PixelForge', 'Agency', '#8b5cf6'],
      ['Sunrise Tutors', 'Education', '#0891b2'], ['Anand Sweets', 'Bakery', '#db2777'],
      ['MetroFit', 'Gym', '#16a34a'], ['CasaDecor', 'Interiors', '#a16207'],
      ['SwiftLogix', 'Logistics', '#2563eb'], ['Threadline', 'Apparel', '#c026d3'],
      ['AquaPure', 'Services', '#0d9488'], ['BrightPath', 'Consulting', '#7c3aed'],
    ],
  },

  /* ── FAQs ───────────────────────────────────────────────────────────────
     These describe what you promise to deliver. Make sure each answer is true
     of your actual service before publishing — they are commitments. */
  faqs: [
    ['What is included in the annual plan?',
      'Your website build, a domain up to ₹999/year, hosting with SSL and CDN, a logo and brand kit, unlimited content changes, the full marketing platform (CRM, AI writer, SEO and analytics tools) and developer support — all for ₹3,999/year.'],
    ['What is included in the monthly plan?',
      'The monthly plan is ₹299/month and includes everything in the annual plan except the free domain. You can switch to annual at any time and we credit the difference.'],
    ['I already have a domain. Can I use it?',
      'Yes. Point your existing domain to SiteForge and we handle the DNS, SSL certificate and redirects for you. There is no extra charge, and your plan price does not change.'],
    ['Will I own the domain?',
      'Yes. The domain is registered in your name with you as the legal registrant. You can transfer it away at any time — we do not hold it hostage.'],
    ['What features are included in the online store?',
      'Add to cart and checkout, payment gateway plus UPI and QR, an admin panel for orders, unlimited products with stock management, discount codes and order notifications by email and WhatsApp. The store add-on is ₹250/month or ₹3,000/year.'],
    ['Will you support updating the website after go-live?',
      'Yes, and it is free. Edit anything yourself from your phone, or message our support team and we make the change for you. There is no per-change fee, ever.'],
    ['How is SiteForge different from other website builders?',
      'Most builders hand you an empty template and an hourly rate for help. SiteForge generates six complete, written-for-you websites from a description of your business, then bundles the domain, hosting, logo, SEO and marketing tools into one price with unlimited edits included.'],
    ['Can I migrate my existing website to SiteForge?',
      'Yes. Share your current site URL and our team moves your pages, images and content across, sets up redirects so you keep your search rankings, and shows you the result before anything goes live.'],
    ['How do I get a 100% refund?',
      'Email support within 30 days of payment and we refund in full, no questions asked. Refunds are processed back to the original payment method within 5–7 working days.'],
    ['What are the charges after one year?',
      'The same ₹3,999/year renewal — including the domain. We do not run a low first-year price and then raise it on renewal.'],
    ['What do I get in the free marketing platform?',
      'A CRM with a lead inbox, an AI writer for offers and social posts, SEO tools that keep your pages updated, social media scheduling, and analytics with ads integration. It is included at no extra cost on every plan.'],
    ['My selected website does not have all my details. How do these get updated?',
      'Add them yourself in the editor — it takes a couple of minutes — or send them to our team and we will fill everything in for you before go-live. Either way it is included.'],
  ],
};
