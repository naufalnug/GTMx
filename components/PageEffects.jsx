'use client'

import { useEffect } from 'react'
import GradientOrb from './ui/GradientOrb'
import { initParallax } from '../lib/animations'

function PageEffects() {
  useEffect(() => {
    initParallax()
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <GradientOrb color="blue" size={600} top="-150px" right="-150px" delay={0} />
      <GradientOrb color="purple" size={500} top="20%" left="-120px" delay={1} />
      <GradientOrb color="teal" size={400} top="40%" right="-80px" delay={2} />
      <GradientOrb color="blue" size={500} top="60%" left="10%" delay={0.5} />
      <GradientOrb color="purple" size={350} top="80%" right="5%" delay={1.5} />
      <GradientOrb color="teal" size={300} top="95%" left="30%" delay={0.8} />
    </div>
  )
}

export default PageEffects
