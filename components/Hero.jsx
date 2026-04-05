'use client'

import { useState } from 'react'
import Terminal from './ui/Terminal'
import TypeWriter from './ui/TypeWriter'
import GlowButton from './ui/GlowButton'
import './Hero.css'

const TERMINAL_LINES = [
  { text: '$ gtmx init --market "us-expansion"', status: null },
  { text: '> Building ICP for US enterprise buyers...', status: 'done' },
  { text: '> Rewriting messaging for Western market...', status: 'done' },
  { text: '> Launching cold email + LinkedIn sequences...', status: 'done' },
  { text: '> Pipeline live. First US meetings booked.', status: 'done' },
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
          <span className="hero__badge">GTM Engineering for APAC B2B Companies</span>
          <h1 className="hero__title">
            Your APAC SaaS Works.<br />
            <span className="hero__title-accent">Now Make It Work in the US.</span>
          </h1>
          <p className="hero__subtitle">
            GTMx builds the outbound revenue engine that gets APAC B2B tech companies<br />
            their first qualified US and European pipeline — in weeks, not quarters.
          </p>
          <p className="hero__icp">
            Built by operators who&apos;ve sold in APAC and executed GTM for YC-backed companies in the US.
          </p>
          <div className="hero__actions">
            <GlowButton href="#book" size="lg">
              {'>>> Book a Free GTM Audit'}
            </GlowButton>
            <GlowButton href="#process" variant="outline" size="lg">
              {'See How It Works →'}
            </GlowButton>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
