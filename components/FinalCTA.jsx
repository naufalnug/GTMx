'use client'

import { useEffect } from 'react'
import './FinalCTA.css'

function FinalCTA() {
  useEffect(() => {
    function initCal() {
      if (window.Cal && window.Cal.ns && window.Cal.ns['30min']) {
        window.Cal.ns['30min']('inline', {
          elementOrSelector: '#my-cal-inline-30min',
          config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true', theme: 'light' },
          calLink: 'naufal-gtmx/30min',
        })
        window.Cal.ns['30min']('ui', { theme: 'light', hideEventTypeDetails: false, layout: 'month_view' })
        return true
      }
      return false
    }

    if (initCal()) return

    const interval = setInterval(() => {
      if (initCal()) clearInterval(interval)
    }, 200)

    return () => clearInterval(interval)
  }, [])

  return (
    <section id="book" className="section dark final-cta">
      <div className="wrap">
        <span className="eyebrow">Free GTM Audit &middot; 30 min</span>
        <h2 className="display" style={{ marginTop: 24 }}>
          Ready to Build Your <em>Outbound Revenue Engine?</em>
        </h2>
        <p className="lede">
          Book a free GTM Audit. We&apos;ll map out exactly what it would take to get
          your first qualified pipeline &mdash; no pitch, no fluff.
        </p>
        <div className="final-cta-embed" id="my-cal-inline-30min"></div>
        <div className="stamp">&mdash; No obligations &middot; No sales pitch &middot; Just clarity &middot;</div>
      </div>
    </section>
  )
}

export default FinalCTA
