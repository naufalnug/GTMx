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
          <h1 className="hero__title">
            YOUR GTM PIPELINE,<br />
            <span className="hero__title-accent">ENGINEERED TO CONVERT.</span>
          </h1>
          <p className="hero__subtitle">
            We build outbound systems that book meetings<br />
            while you focus on closing deals.
          </p>
          <div className="hero__actions">
            <GlowButton href="#book" size="lg">
              {'>>> Book a Strategy Call'}
            </GlowButton>
            <a href="#services" className="hero__scroll-link">
              See How It Works <span className="hero__arrow">v</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
