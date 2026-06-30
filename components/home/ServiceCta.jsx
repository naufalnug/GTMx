'use client'

/* ──────────────────────────────────────────────
   GTMx — components/home/ServiceCta.jsx
   Accent close-panel + INLINE Cal.com booking calendar
   (team/gtmx/initial-consultation-call) for the service
   detail pages. The whole section is the #book target.
   Brand colour follows the page's --accent.
   ────────────────────────────────────────────── */

import { useCalEmbed } from '../../lib/useCalEmbed'

export default function ServiceCta({ serviceName }) {
  // Defer the Cal.com embed until visible; brand matches the page's accent.
  useCalEmbed({
    elementId: 'svc-cal-embed',
    brand: () => {
      const page = document.querySelector('.svc-page')
      return (page && getComputedStyle(page).getPropertyValue('--accent').trim()) || '#E8552B'
    },
  })

  return (
    <section className="scta" id="book">
      <div className="scta__panel">
        <span className="scta__blob" style={{ width: 200, height: 200, background: 'rgba(255,253,247,.16)', top: -50, left: -40 }}></span>
        <span className="scta__blob" style={{ width: 160, height: 160, background: 'var(--gold)', bottom: -50, right: -30 }}></span>
        <span className="scta__eyebrow"><span className="dot"></span>Free GTM audit &middot; 30 min</span>
        <h2>Ready to build your {serviceName.toLowerCase()} engine?</h2>
        <p>Pick a time below &mdash; we&apos;ll map exactly what it takes and show you where the pipeline is. No pitch, no fluff.</p>
      </div>

      <div className="svc-booking">
        <div className="svc-booking__frame">
          <div id="svc-cal-embed" className="svc-booking__cal"></div>
        </div>
      </div>
    </section>
  )
}
