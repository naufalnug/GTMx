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
const PARTNERS = [
  { src: '/partners/clay.png', alt: 'Clay', width: 220, height: 168 },
  { src: '/partners/smartlead.png', alt: 'Smartlead', width: 800, height: 800 },
  { src: '/partners/instantly.png', alt: 'Instantly', width: 200, height: 200 },
  { src: '/partners/heyreach.png', alt: 'HeyReach', width: 301, height: 301 },
  { src: '/partners/emailbison.png', alt: 'EmailBison', width: 512, height: 512 },
  { src: '/partners/trigify.png', alt: 'Trigify', width: 2000, height: 2000 },
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
