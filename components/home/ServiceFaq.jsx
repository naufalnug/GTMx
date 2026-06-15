'use client'

/* ──────────────────────────────────────────────
   GTMx — components/home/ServiceFaq.jsx
   Click-to-expand accordion for the service detail pages.
   One open at a time. Inherits the page's --accent.
   ────────────────────────────────────────────── */

import { useState } from 'react'

const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1A1712" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
)

export default function ServiceFaq({ items }) {
  const [open, setOpen] = useState(null)

  return (
    <section className="section">
      <div className="wrap">
        <div className="sec-head"><h2 className="h2">Fair <span className="hl">questions.</span></h2></div>
        <div className="faq">
          {items.map((f, i) => (
            <div key={i} className={'faq-item' + (open === i ? ' open' : '')}>
              <button className="faq-q" type="button" onClick={() => setOpen(open === i ? null : i)}>
                {f.q}
                <span className="ic"><PlusIcon /></span>
              </button>
              <div className="faq-a"><div className="faq-a__in">{f.a}</div></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
