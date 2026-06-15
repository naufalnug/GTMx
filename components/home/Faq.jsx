'use client'

/* ──────────────────────────────────────────────
   GTMx — components/home/Faq.jsx
   Friendly click-to-expand accordion. One open at a time.
   ────────────────────────────────────────────── */

import { useState } from 'react'

const ITEMS = [
  {
    q: 'We should just hire a VP of Sales.',
    a: 'A VP of Sales costs $250K+ and takes 6 months to ramp — and nearly half of first senior sales hires are replaced within 2 years, because there was no repeatable process for them to execute. GTMx builds the engine first. Then you hire the driver into a system that’s already producing pipeline.',
  },
  {
    q: 'We tried cold email before and it didn’t work.',
    a: 'Your messaging was built for the wrong audience. Different buyer segments need different pain points, urgency triggers, and social proof. We don’t just run email campaigns — we rebuild your entire outbound approach specifically for your target buyer.',
  },
  {
    q: 'Isn’t this just an SDR agency?',
    a: 'SDR agencies send emails. GTMx engineers your entire GTM system: ICP refinement, buyer positioning, full outbound infrastructure, and the RevOps foundations your team needs to operate at speed. We’re not a vendor — we’re your outbound engine.',
  },
  {
    q: 'How quickly can pipeline go live?',
    a: 'Most engagements have campaigns live within 2–3 weeks: domain warmup and infrastructure in week 1, list and messaging in weeks 2–3, launch by week 3–4. First qualified meetings typically land within 30 days.',
  },
  {
    q: 'What stack do you use?',
    a: 'Our default stack: Clay for enrichment, Instantly for cold email, HeyReach for LinkedIn, HubSpot for CRM. We adapt to your tooling — we’re not a one-size-fits-all shop.',
  },
]

export default function Faq() {
  const [open, setOpen] = useState(null)

  return (
    <section className="section" id="faq">
      <div className="sec-head">
        <h2 className="h2">Fair <span className="hl">questions.</span></h2>
        <p className="sec-lede">The things every founder asks before they trust us with their pipeline.</p>
      </div>
      <div className="faq">
        {ITEMS.map((item, i) => (
          <div key={i} className={'faq-item' + (open === i ? ' open' : '')}>
            <button className="faq-q" type="button" onClick={() => setOpen(open === i ? null : i)}>
              {item.q}
              <span className="ic">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1A1712" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </span>
            </button>
            <div className="faq-a"><div className="faq-a__inner">{item.a}</div></div>
          </div>
        ))}
      </div>
    </section>
  )
}
