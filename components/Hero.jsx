'use client'

import { useState } from 'react'
import Terminal from './ui/Terminal'
import TypeWriter from './ui/TypeWriter'
import GlowButton from './ui/GlowButton'
import './Hero.css'

const TERMINAL_LINES = [
  { text: '$ gtmx init --pipeline "outbound"', status: null },
  { text: '> Initializing cold email infrastructure...', status: 'done' },
  { text: '> Enriching 2,847 leads via Clay...', status: 'done' },
  { text: '> Sequencing across 12 sender accounts...', status: 'done' },
  { text: '> Pipeline live. 47 meetings booked.', status: 'done' },
]

function Hero() {
  const [typingDone, setTypingDone] = useState(false)

  return (
    <section className="hero">
      <div className="hero__inner">
        <div className="hero__terminal">
          <Terminal title="gtmx-pipeline">
            <TypeWriter
              lines={TERMINAL_LINES}
              typingSpeed={20}
              lineDelay={300}
              onComplete={() => setTypingDone(true)}
            />
          </Terminal>
        </div>

        <div className={`hero__content ${typingDone ? 'hero__content--visible' : ''}`}>
          <span className="hero__badge">GTM Engineering for B2B Teams</span>
          <h1 className="hero__title">
            Predictable Pipeline in 90 Days.<br />
            <span className="hero__title-accent">No Extra Headcount Required.</span>
          </h1>
          <p className="hero__subtitle">
            We build and operate your outbound infrastructure — email, LinkedIn,<br />
            enrichment, and routing — so your team closes deals, not configures tools.
          </p>
          <p className="hero__icp">
            For Series A/B B2B teams across APAC and globally — with a sales org of 5–50 reps and a pipeline problem.
          </p>
          <div className="hero__actions">
            <div className="hero__cta-wrapper">
              <GlowButton href="#book" size="lg">
                {'>>> Book a Free GTM Audit'}
              </GlowButton>
              <span className="hero__cta-micro">No pitch. 30 mins. Available across SGT, AEST, and APAC timezones.</span>
            </div>
            <GlowButton href="#case-studies" variant="outline" size="lg">
              {'See Client Results →'}
            </GlowButton>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
