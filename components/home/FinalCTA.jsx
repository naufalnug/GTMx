'use client'

/* ──────────────────────────────────────────────
   GTMx — components/home/FinalCTA.jsx
   Bold vermillion close panel + an INLINE Cal.com booking
   calendar (team/gtmx/initial-consultation-call) embedded
   directly in the page — no popup. The whole section is the
   #book target the nav scrolls to.
   ────────────────────────────────────────────── */

import { useEffect } from 'react'

const CAL_NS = 'initial-consultation-call'
const CAL_LINK = 'team/gtmx/initial-consultation-call'

export default function FinalCTA() {
  useEffect(() => {
    // Cal.com inline embed loader (official snippet, adapted for React)
    ;(function (C, A, L) {
      let p = function (a, ar) { a.q.push(ar) }
      let d = C.document
      C.Cal = C.Cal || function () {
        let cal = C.Cal
        let ar = arguments
        if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true }
        if (ar[0] === L) {
          const api = function () { p(api, arguments) }
          const namespace = ar[1]
          api.q = api.q || []
          if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]) } else p(cal, ar)
          return
        }
        p(cal, ar)
      }
    })(window, 'https://app.cal.com/embed/embed.js', 'init')

    const Cal = window.Cal
    Cal('init', CAL_NS, { origin: 'https://app.cal.com' })
    Cal.config = Cal.config || {}
    Cal.config.forwardQueryParams = true
    Cal.ns[CAL_NS]('inline', {
      elementOrSelector: '#cal-inline-booking',
      config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true' },
      calLink: CAL_LINK,
    })
    Cal.ns[CAL_NS]('ui', {
      theme: 'light',
      cssVarsPerTheme: { light: { 'cal-brand': '#E8552B' } },
      hideEventTypeDetails: false,
      layout: 'month_view',
    })
  }, [])

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
