/* ──────────────────────────────────────────────
   GTMx — components/home/Partners.jsx
   "Partners of" trust strip beneath the hero. Logos sit in
   uniform white chips so the varied brand marks read as one
   consistent row. Files live in /public/partners/.
   ────────────────────────────────────────────── */

// Intrinsic pixel dimensions (natural size of each PNG) so the browser can
// reserve the correct box before the logo loads → no layout shift (CLS). The
// visible size stays fully CSS-controlled (`.partners__logo` pins height and
// leaves width auto), so these attributes change nothing you can see.
/* Alt text states the partnership because all six were confirmed by the owner on
   2026-10-03, matching the visible "Official partners of:" label. If any
   partnership lapses, the alt must drop to plain "[Brand] logo". */
const PARTNERS = [
  { src: '/partners/clay.png', alt: 'Clay logo: GTMx is an official Clay partner', width: 157, height: 120 },
  { src: '/partners/smartlead.png', alt: 'Smartlead logo: GTMx is an official Smartlead partner', width: 120, height: 120 },
  { src: '/partners/instantly.png', alt: 'Instantly logo: GTMx is an official Instantly partner', width: 120, height: 120 },
  { src: '/partners/heyreach.png', alt: 'HeyReach logo: GTMx is an official HeyReach partner', width: 120, height: 120 },
  { src: '/partners/emailbison.png', alt: 'EmailBison logo: GTMx is an official EmailBison partner', width: 120, height: 120 },
  { src: '/partners/trigify.png', alt: 'Trigify logo: GTMx is an official Trigify partner', width: 120, height: 120 },
]

export default function Partners() {
  return (
    <section className="partners" aria-label="Partners">
      <span className="partners__label">Official partners of:</span>
      <div className="partners__row">
        {PARTNERS.map(p => (
          <span key={p.src} className="partners__chip">
            <img src={p.src} alt={p.alt} width={p.width} height={p.height} className="partners__logo" loading="lazy" decoding="async" />
          </span>
        ))}
      </div>
    </section>
  )
}
