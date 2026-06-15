'use client'

/* ──────────────────────────────────────────────
   GTMx — components/home/Navbar.jsx
   Shared site navigation. Fixed to the top so it stays
   constant as the page scrolls; gains a frosted peach
   backdrop + hairline once you scroll past the top.
   Self-contained styles (Navbar.css) so it can be dropped
   onto the home page AND the content / legal routes without
   depending on the `.dd` homepage scope.
   ────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import './Navbar.css'

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
)

export default function Navbar() {
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={'gnav' + (stuck ? ' is-stuck' : '')}>
      <div className="gnav__inner">
        <a href="/" className="gnav__brand" aria-label="GTMx — home">
          <b>gtm<span className="x">x</span></b><span className="dot"></span>
        </a>

        <nav className="gnav__links">
          <a href="/#services">Services</a>
          <a href="/#method">Method</a>
          <a href="/#work">Results</a>
          <a href="/content">Blog</a>
        </nav>

        <a href="/#book" className="gnav__cta">Book a call <Arrow /></a>
      </div>
    </header>
  )
}
