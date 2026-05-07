'use client'

import { useEffect } from 'react'
import './Hero.css'

function Hero() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.15 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section className="hero wrap">
      <div className="hero-grid">
        <div>
          <span className="eyebrow">GTM Engineering for B2B Tech Companies</span>
          <h1 className="display">
            Your Product Works.<br />
            Now Build the <em>Revenue Engine.</em>
          </h1>
          <p className="lede">
            GTMx builds the outbound revenue engine that gets B2B tech companies
            their first qualified pipeline — in weeks, not quarters.
          </p>
          <div className="hero-actions">
            <a href="#book" className="btn btn-primary btn-lg">
              Book a Free GTM Audit
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="arrow"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </a>
            <a href="#process" className="btn btn-ghost btn-lg">See How It Works</a>
          </div>
          <div className="hero-trust">
            <strong>Built by operators</strong>
            <span>&middot; 8+ yrs B2B sales &amp; GTM engineering</span>
            <span>&middot; YC-portfolio GTM systems</span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <EngineCard />
          <span className="float-chip chip-tl">
            <span style={{ width: 6, height: 6, borderRadius: 99, background: '#1F8A5B' }} /> 47 SQLs &middot; last 30 days
          </span>
          <span className="float-chip chip-br">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="ico"><path d="M7 17L17 7M9 7h8v8" /></svg>
            $170K pipeline added
          </span>
        </div>
      </div>
    </section>
  )
}

function EngineCard() {
  return (
    <div className="engine-card">
      <div className="engine-head">
        <div>
          <div className="engine-label">outbound engine</div>
          <div className="engine-client">OpenSponsorship &middot; pipeline run</div>
        </div>
        <span className="live"><span className="pulse" /> live</span>
      </div>

      <div className="engine-flow">
        <div className="flow-node">
          <div className="nm">B2B Tech</div>
          <div className="sub">Source</div>
        </div>
        <div className="flow-arrow">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
        </div>
        <div className="flow-node flow-node--accent">
          <div className="nm">Outbound</div>
          <div className="sub">Email &middot; LinkedIn</div>
        </div>
        <div className="flow-arrow">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
        </div>
        <div className="flow-node">
          <div className="nm">Qualified Pipeline</div>
          <div className="sub">Meetings</div>
        </div>
      </div>

      <div className="engine-stats">
        <div className="engine-stat">
          <div className="v">40<em>+</em></div>
          <div className="l">SQLs</div>
        </div>
        <div className="engine-stat">
          <div className="v">$170K</div>
          <div className="l">Pipeline</div>
        </div>
        <div className="engine-stat">
          <div className="v">$10K</div>
          <div className="l">Closed</div>
        </div>
      </div>

      <div className="engine-foot">
        <span>Channels: Cold email + LinkedIn</span>
        <span className="client">Wk 6 &middot; running</span>
      </div>
    </div>
  )
}

export default Hero
