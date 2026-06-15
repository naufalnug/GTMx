'use client'

/* ──────────────────────────────────────────────
   GTMx — components/home/ServiceCta.jsx
   Accent close-panel + INLINE Cal.com booking calendar
   (team/gtmx/initial-consultation-call) for the service
   detail pages. The whole section is the #book target.
   Brand colour follows the page's --accent.
   ────────────────────────────────────────────── */

import { useEffect } from 'react'

const CAL_NS = 'initial-consultation-call'
const CAL_LINK = 'team/gtmx/initial-consultation-call'

export default function ServiceCta({ serviceName }) {
  useEffect(() => {
    // pull the page's service accent so the calendar matches
    const page = document.querySelector('.svc-page')
    const accent = (page && getComputedStyle(page).getPropertyValue('--accent').trim()) || '#E8552B'

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
      elementOrSelector: '#svc-cal-embed',
      config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true' },
      calLink: CAL_LINK,
    })
    Cal.ns[CAL_NS]('ui', {
      theme: 'light',
      cssVarsPerTheme: { light: { 'cal-brand': accent } },
      hideEventTypeDetails: false,
      layout: 'month_view',
    })
  }, [])

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
