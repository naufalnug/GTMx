'use client'

import { useState, useEffect } from 'react'
import './Navbar.css'

const NAV_LINKS = [
  { label: 'How It Works', href: '#process' },
  { label: 'Who It\u2019s For', href: '#icp' },
  { label: 'Results', href: '#case-studies' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Content', href: '/content' },
]

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="wrap nav-inner">
        <a href="#" className="brand">
          GTMx<span className="dot" />
        </a>

        <div className="nav-links">
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </div>

        <a href="#book" className="btn btn-primary btn-sm nav-cta-desktop">
          Book Free Audit
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="arrow"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
        </a>

        <button
          className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`nav-mobile ${menuOpen ? 'nav-mobile--open' : ''}`}>
        {NAV_LINKS.map(link => (
          <a
            key={link.href}
            href={link.href}
            className="nav-mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </a>
        ))}
        <a href="#book" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
          Book Free Audit
        </a>
      </div>
    </nav>
  )
}

export default Navbar
