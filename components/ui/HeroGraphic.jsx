'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './HeroGraphic.css'

function HeroGraphic() {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current) return

    const cards = svgRef.current.querySelectorAll('.flow-card')
    const lines = svgRef.current.querySelectorAll('.flow-line')
    const labels = svgRef.current.querySelectorAll('.flow-label')
    const icons = svgRef.current.querySelectorAll('.flow-icon')
    const pulses = svgRef.current.querySelectorAll('.flow-pulse')

    gsap.from(cards, {
      scale: 0.85,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'back.out(1.5)',
      delay: 0.3,
    })

    gsap.from(icons, {
      scale: 0,
      duration: 0.4,
      stagger: 0.1,
      ease: 'back.out(2)',
      delay: 0.5,
    })

    gsap.from(lines, {
      strokeDashoffset: 400,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: 'power2.out',
      delay: 0.7,
    })

    gsap.from(labels, {
      opacity: 0,
      duration: 0.5,
      stagger: 0.08,
      delay: 0.9,
    })

    pulses.forEach((pulse, i) => {
      gsap.to(pulse, {
        scale: 2.5,
        opacity: 0,
        duration: 2.5,
        ease: 'power1.out',
        repeat: -1,
        delay: i * 0.8,
      })
    })
  }, [])

  return (
    <div className="hero-graphic">
      <svg ref={svgRef} viewBox="0 0 900 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#000" floodOpacity="0.06" />
          </filter>
        </defs>

        {/* APAC card */}
        <rect className="flow-card" x="0" y="30" rx="14" ry="14" width="160" height="100" fill="white" stroke="#E5E7EB" strokeWidth="1.5" filter="url(#cardShadow)" />
        <circle className="flow-icon" cx="80" cy="65" r="14" fill="#2563EB" />
        <circle className="flow-pulse" cx="80" cy="65" r="14" fill="none" stroke="#2563EB" strokeWidth="1.5" opacity="0.3" />
        <text className="flow-label" x="80" y="105" textAnchor="middle" fill="#111827" fontSize="14" fontWeight="600" fontFamily="Inter, sans-serif">APAC</text>

        {/* Arrow 1 */}
        <path className="flow-line" d="M 165 80 C 200 80, 210 55, 240 55" stroke="#2563EB" strokeWidth="2" strokeDasharray="6 4" opacity="0.3" />

        {/* ICP card */}
        <rect className="flow-card" x="240" y="20" rx="12" ry="12" width="120" height="70" fill="white" stroke="#E5E7EB" strokeWidth="1" filter="url(#cardShadow)" />
        <circle className="flow-icon" cx="300" cy="45" r="8" fill="#2563EB" opacity="0.6" />
        <text className="flow-label" x="300" y="72" textAnchor="middle" fill="#4B5563" fontSize="12" fontWeight="500" fontFamily="Inter, sans-serif">ICP Build</text>

        {/* Arrow 2 */}
        <path className="flow-line" d="M 365 55 C 395 55, 405 105, 435 105" stroke="#2563EB" strokeWidth="2" strokeDasharray="6 4" opacity="0.3" />

        {/* Messaging card */}
        <rect className="flow-card" x="435" y="70" rx="12" ry="12" width="120" height="70" fill="white" stroke="#E5E7EB" strokeWidth="1" filter="url(#cardShadow)" />
        <circle className="flow-icon" cx="495" cy="95" r="8" fill="#2563EB" opacity="0.6" />
        <text className="flow-label" x="495" y="122" textAnchor="middle" fill="#4B5563" fontSize="12" fontWeight="500" fontFamily="Inter, sans-serif">Messaging</text>

        {/* Arrow 3 */}
        <path className="flow-line" d="M 560 105 C 590 105, 600 55, 630 55" stroke="#2563EB" strokeWidth="2" strokeDasharray="6 4" opacity="0.3" />

        {/* Outbound card */}
        <rect className="flow-card" x="630" y="20" rx="12" ry="12" width="120" height="70" fill="white" stroke="#E5E7EB" strokeWidth="1" filter="url(#cardShadow)" />
        <circle className="flow-icon" cx="690" cy="45" r="8" fill="#2563EB" opacity="0.6" />
        <text className="flow-label" x="690" y="72" textAnchor="middle" fill="#4B5563" fontSize="12" fontWeight="500" fontFamily="Inter, sans-serif">Outbound</text>

        {/* Arrow 4 */}
        <path className="flow-line" d="M 755 55 C 785 55, 790 80, 800 80" stroke="#059669" strokeWidth="2" strokeDasharray="6 4" opacity="0.3" />

        {/* US/EU card */}
        <rect className="flow-card" x="740" y="30" rx="14" ry="14" width="160" height="100" fill="white" stroke="#D1FAE5" strokeWidth="2" filter="url(#cardShadow)" />
        <circle className="flow-icon" cx="820" cy="65" r="14" fill="#059669" />
        <circle className="flow-pulse" cx="820" cy="65" r="14" fill="none" stroke="#059669" strokeWidth="1.5" opacity="0.3" />
        <text className="flow-label" x="820" y="105" textAnchor="middle" fill="#111827" fontSize="14" fontWeight="600" fontFamily="Inter, sans-serif">US / EU</text>

        {/* Traveling dots */}
        <circle r="5" fill="#2563EB" opacity="0.8">
          <animateMotion dur="4s" repeatCount="indefinite" path="M 160 80 C 200 80 210 55 300 55 C 395 55 405 105 495 105 C 590 105 600 55 690 55 C 785 55 790 80 820 80" />
        </circle>
        <circle r="4" fill="#2563EB" opacity="0.4">
          <animateMotion dur="4s" repeatCount="indefinite" begin="1.5s" path="M 160 80 C 200 80 210 55 300 55 C 395 55 405 105 495 105 C 590 105 600 55 690 55 C 785 55 790 80 820 80" />
        </circle>
      </svg>
    </div>
  )
}

export default HeroGraphic
