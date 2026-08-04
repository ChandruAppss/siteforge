/* The six design directions. Each gets its own art-direction brief so the
   results are genuinely different rather than six recolours of one layout. */

export const STYLES = [
  {
    name: 'Modern Minimal',
    note: 'Clean and airy. Lots of whitespace, one accent colour, confident type.',
    brief:
      'Minimal editorial design. Near-white background (#fbfbfd), near-black text, ONE accent colour. ' +
      'Very generous whitespace, large type scale, thin 1px hairline dividers, no drop shadows, ' +
      'no gradients. Sans-serif throughout (Inter or DM Sans). Restrained and premium.',
  },
  {
    name: 'Bold & Vibrant',
    note: 'High-energy colour blocking, big headlines, strong calls to action.',
    brief:
      'Loud and energetic. Full-bleed colour-blocked sections that alternate between a saturated brand ' +
      'colour and white. Huge tightly-tracked headlines (clamp up to 72px), chunky pill buttons, ' +
      'playful rotated badges. High contrast. Poppins or Outfit for headings.',
  },
  {
    name: 'Elegant Premium',
    note: 'Serif headlines, muted palette, the look of a high-end brand.',
    brief:
      'Upmarket and refined. Serif display headings (Playfair Display or Fraunces) paired with a clean ' +
      'sans body. Muted palette — warm ivory, deep charcoal, a single metallic-feeling accent (bronze or ' +
      'deep green). Wide letter-spaced uppercase eyebrows, thin rules, slow subtle reveals. Luxury feel.',
  },
  {
    name: 'Warm & Friendly',
    note: 'Soft rounded shapes, warm colours, approachable and human.',
    brief:
      'Friendly and approachable. Warm palette — terracotta, cream, soft sage. Large border-radius ' +
      '(20-28px) on every card and button, soft diffuse shadows, blob/wave SVG section dividers. ' +
      'Rounded font (Nunito or Quicksand). Feels handmade and local, not corporate.',
  },
  {
    name: 'Corporate Trust',
    note: 'Structured, credible, built for enquiries and B2B buyers.',
    brief:
      'Professional and credible. Navy and steel-blue palette with a clean white base. Structured grid, ' +
      'clear section rules, stat bands, a comparison or capability table, prominent enquiry form. ' +
      'System-ish sans (Inter or IBM Plex Sans). Information-dense but tidy. B2B trustworthy.',
  },
  {
    name: 'Dark Luxe',
    note: 'Dark background, glowing accents, a striking modern statement.',
    brief:
      'Dark mode statement design. Near-black background (#0b0b0f), light text, glowing gradient accents ' +
      '(violet to cyan), subtle glass-morphism cards with 1px light borders, soft radial glows behind ' +
      'headings. Space Grotesk or Sora for headings. Dramatic and modern.',
  },
];

export const VARIANT_COUNT = Math.min(
  STYLES.length,
  Math.max(1, Number(process.env.VARIANT_COUNT) || STYLES.length)
);
