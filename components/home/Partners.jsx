/* ──────────────────────────────────────────────
   GTMx — components/home/Partners.jsx
   "Partners of" trust strip beneath the hero. Logos sit in
   uniform white chips so the varied brand marks read as one
   consistent row. Files live in /public/partners/.
   ────────────────────────────────────────────── */

const PARTNERS = [
  { src: '/partners/clay.png', alt: 'Clay' },
  { src: '/partners/smartlead.png', alt: 'Smartlead' },
  { src: '/partners/instantly.png', alt: 'Instantly' },
  { src: '/partners/heyreach.png', alt: 'HeyReach' },
  { src: '/partners/emailbison.png', alt: 'EmailBison' },
  { src: '/partners/trigify.png', alt: 'Trigify' },
]

export default function Partners() {
  return (
    <section className="partners" aria-label="Partners">
      <span className="partners__label">Official partners of:</span>
      <div className="partners__row">
        {PARTNERS.map(p => (
          <span key={p.src} className="partners__chip">
            <img src={p.src} alt={p.alt} className="partners__logo" loading="lazy" />
          </span>
        ))}
      </div>
    </section>
  )
}
