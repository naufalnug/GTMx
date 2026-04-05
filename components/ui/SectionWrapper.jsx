'use client'

import { useRef, useEffect } from 'react'
import { animateSection } from '../../lib/animations'

function SectionWrapper({ id, children, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    animateSection(ref.current)
  }, [])

  return (
    <section
      id={id}
      ref={ref}
      className={`section ${className}`}
      style={{
        padding: 'var(--space-2xl) var(--space-lg)',
      }}
    >
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
        {children}
      </div>
    </section>
  )
}

export default SectionWrapper
