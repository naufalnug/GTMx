import { useInView } from 'react-intersection-observer'

function SectionWrapper({ id, children, className = '' }) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <section
      id={id}
      ref={ref}
      className={`section ${className} ${inView ? 'section--visible' : ''}`}
      style={{
        padding: 'var(--space-3xl) var(--space-lg)',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
        {children}
      </div>
    </section>
  )
}

export default SectionWrapper
