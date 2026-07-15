'use client'

/* ──────────────────────────────────────────────
   GTMx — components/home/ServiceCta.jsx
   Accent close-panel + INLINE Cal.com booking calendar
   (team/gtmx/initial-consultation-call) for the service
   detail pages. The whole section is the #book target.
   Brand colour follows the page's --accent.
   ────────────────────────────────────────────── */

import { useDeferredCalEmbed } from '../useDeferredCalEmbed'

const CAL_NS = 'initial-consultation-call'
const CAL_LINK = 'team/gtmx/initial-consultation-call'

export default function ServiceCta({ serviceName }) {
  // Deferred until the booking section nears the viewport (see the hook). The
  // accent is read from the page's --accent at load time, exactly as before.
  useDeferredCalEmbed({
    namespace: CAL_NS,
    calLink: CAL_LINK,
    elementId: 'svc-cal-embed',
    forwardQueryParams: true,
    ui: () => {
      const page = document.querySelector('.svc-page')
      const accent = (page && getComputedStyle(page).getPropertyValue('--accent').trim()) || '#E8552B'
      return {
        theme: 'light',
        cssVarsPerTheme: { light: { 'cal-brand': accent } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      }
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
