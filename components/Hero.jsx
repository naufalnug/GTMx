'use client'

import { useEffect, useRef } from 'react'
import GlowButton from './ui/GlowButton'
import WordRotator from './ui/WordRotator'
import { animateHeroText } from '../lib/animations'
import './Hero.css'

function Hero() {
  const contentRef = useRef(null)

  useEffect(() => {
    animateHeroText(contentRef.current)
  }, [])

  return (
    <section className="hero">
      <div className="hero__inner" ref={contentRef}>
        <span className="hero__badge" data-animate="hero-reveal">
          GTM Engineering for APAC B2B Companies
        </span>
        <h1 className="hero__title" data-animate="hero-reveal">
          Your APAC SaaS Works.<br />
          <span className="hero__title-accent">
            Now Make It Work in <WordRotator />
          </span>
        </h1>
        <p className="hero__subtitle" data-animate="hero-reveal">
          GTMx builds the outbound revenue engine that gets APAC B2B tech companies
          their first qualified US and European pipeline — in weeks, not quarters.
        </p>
        <p className="hero__icp" data-animate="hero-reveal">
          Built by operators who&apos;ve sold in APAC and executed GTM for YC-backed companies in the US.
        </p>
        <div className="hero__actions" data-animate="hero-reveal">
          <GlowButton href="#book" size="lg">
            {'>>> Book a Free GTM Audit'}
          </GlowButton>
          <GlowButton href="#process" variant="outline" size="lg">
            {'See How It Works →'}
          </GlowButton>
        </div>

      </div>
    </section>
  )
}

export default Hero
