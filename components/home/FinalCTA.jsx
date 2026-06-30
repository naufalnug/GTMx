'use client'

/* ──────────────────────────────────────────────
   GTMx — components/home/FinalCTA.jsx
   Bold vermillion close panel + an INLINE Cal.com booking
   calendar (team/gtmx/initial-consultation-call) embedded
   directly in the page — no popup. The whole section is the
   #book target the nav scrolls to.
   ────────────────────────────────────────────── */

import { useCalEmbed } from '../../lib/useCalEmbed'

export default function FinalCTA() {
  // Cal.com embed loads only when the booking section nears the viewport.
  useCalEmbed({ elementId: 'cal-inline-booking' })

  return (
    <section className="final" id="book">
      <div className="final-panel">
        <span className="final-blob" style={{ width: 200, height: 200, background: 'var(--sky)', top: -50, left: -40 }}></span>
        <span className="final-blob" style={{ width: 160, height: 160, background: 'var(--gold)', bottom: -50, right: -30 }}></span>
        <span className="final-eyebrow">Free GTM audit &middot; 30 min</span>
        <h2>Ready to build your <span className="u">engine?</span></h2>
        <p>Pick a time below and we&apos;ll map exactly what it takes to get your first qualified pipeline &mdash; outbound, RevOps, and search. No pitch, no fluff.</p>
        <p className="final-stamp">&mdash; No obligations &middot; no sales pitch &middot; just clarity &mdash;</p>
      </div>

      <div className="booking">
        <div className="booking__frame">
          <div id="cal-inline-booking" className="booking__cal"></div>
        </div>
      </div>
    </section>
  )
}
