'use client'

/* ──────────────────────────────────────────────
   GTMx — components/home/Faq.jsx
   Tabbed FAQ, mirroring The GTMx Method:
     section head → 3 shared accordions (always visible)
     → `// by service` divider → service tabs
       (Outbound / RevOps / Search, same coral/blue/green
        coding as the Method tabs) → that service's 5 Q&As.
   One item open at a time within each group. Defaults:
   Outbound tab active, first question of each group open.
   ────────────────────────────────────────────── */

import { useState } from 'react'
import { faqShared, faqTabs } from '../../data/faq'

const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1A1712" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
)

function Item({ item, isOpen, onToggle }) {
  return (
    <div className={'faq-item' + (isOpen ? ' open' : '')}>
      <button className="faq-q" type="button" onClick={onToggle}>
        {item.q}
        <span className="ic"><PlusIcon /></span>
      </button>
      <div className="faq-a"><div className="faq-a__inner">{item.a}</div></div>
    </div>
  )
}

export default function Faq() {
  const [activeTab, setActiveTab] = useState(faqTabs[0].id)
  const [openShared, setOpenShared] = useState(0)
  // open question index per tab id; undefined → default to 0
  const [openByTab, setOpenByTab] = useState({})

  const openFor = id => (id in openByTab ? openByTab[id] : 0)

  return (
    <section className="section" id="faq">
      <div className="sec-head">
        <span className="faq-eyebrow">Questions</span>
        <h2 className="h2">GTM engineering, <span className="hl">answered.</span></h2>
        <p className="sec-lede">The objections we hear on every call &mdash; answered up front so you don&apos;t have to ask.</p>
      </div>

      {/* shared — always visible */}
      <div className="faq">
        {faqShared.map((item, i) => (
          <Item
            key={i}
            item={item}
            isOpen={openShared === i}
            onToggle={() => setOpenShared(openShared === i ? null : i)}
          />
        ))}
      </div>

      <div className="faq-divider"><span>// by service</span></div>

      {/* service tabs — same coding as the Method tabs */}
      <div className="method-tabs faq-tabs">
        {faqTabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={'mtab' + (activeTab === tab.id ? ' is-active' : '')}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="mtab__dot"></span>{tab.label}
          </button>
        ))}
      </div>

      <div className="faq faq-svc">
        {faqTabs.map(tab => (
          <div
            key={tab.id}
            className={'faq-panel' + (activeTab === tab.id ? ' is-active' : '')}
            data-svc={tab.id}
          >
            {tab.items.map((item, i) => (
              <Item
                key={i}
                item={item}
                isOpen={openFor(tab.id) === i}
                onToggle={() =>
                  setOpenByTab(prev => ({
                    ...prev,
                    [tab.id]: openFor(tab.id) === i ? null : i,
                  }))
                }
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
