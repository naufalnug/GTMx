/* ──────────────────────────────────────────────
   GTMx — components/Services.jsx
   Landing-page Services section. Clean cards
   (icon + title + blurb + "Learn more"), one per
   service in data/services.js. Replaces Solution.
   ────────────────────────────────────────────── */

import { services } from '../data/services'
import './Services.css'

/* One simple inline-SVG glyph per service — the card's visual accent. */
const ICONS = {
  mail: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  flow: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="7" height="5" rx="1.2" />
      <rect x="3" y="15" width="7" height="5" rx="1.2" />
      <rect x="14" y="9.5" width="7" height="5" rx="1.2" />
      <path d="M10 6.5h2.5a1.5 1.5 0 0 1 1.5 1.5v1.5M10 17.5h2.5a1.5 1.5 0 0 0 1.5-1.5v-1.5" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
}

export default function Services() {
  return (
    <section id="services" className="section services">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">// what_we_do</span>
          <div>
            <h2 className="h2">Three services.<br /><em>One revenue engine.</em></h2>
          </div>
        </div>

        <div className="services__grid">
          {services.map(s => (
            <a key={s.slug} href={`/services/${s.slug}`} className="services__card reveal">
              <span className="services__icon">{ICONS[s.icon]}</span>
              <span className="services__tag">{s.tag}</span>
              <h3 className="services__title">{s.title}</h3>
              <p className="services__blurb">{s.blurb}</p>
              <span className="services__more">
                Learn more
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="services__arrow"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
