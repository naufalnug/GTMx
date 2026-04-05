'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './GradientOrb.css'

function GradientOrb({ color = 'blue', size = 400, top, left, right, bottom, delay = 0 }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return

    gsap.to(ref.current, {
      y: '+=30',
      x: '+=20',
      duration: 6,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay,
    })
  }, [delay])

  const colorMap = {
    blue: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%)',
    purple: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
    teal: 'radial-gradient(circle, rgba(5, 150, 105, 0.08) 0%, transparent 70%)',
    orange: 'radial-gradient(circle, rgba(234, 88, 12, 0.08) 0%, transparent 70%)',
  }

  return (
    <div
      ref={ref}
      className="gradient-orb"
      style={{
        width: size,
        height: size,
        background: colorMap[color] || colorMap.blue,
        top,
        left,
        right,
        bottom,
      }}
    />
  )
}

export default GradientOrb
