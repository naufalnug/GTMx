import { pillars } from '../data/solution'
import './Solution.css'

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function EngineIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10h2M7 14h6M14 10h3" />
    </svg>
  )
}

function WorkflowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="15" width="6" height="6" rx="1" />
      <path d="M9 6h6a3 3 0 013 3v6" />
    </svg>
  )
}

const ICONS = [<EngineIcon key="e" />, <WorkflowIcon key="w" />]

function Solution() {
  return (
    <section className="section" style={{ background: 'var(--bg-sunk)' }}>
      <div className="wrap section-head">
        <span className="eyebrow">What We Build</span>
        <h2 className="h2">
          We don&apos;t consult. We <em>engineer</em> your revenue engine.
        </h2>
      </div>
      <div className="wrap solution-grid">
        {pillars.map((pillar, i) => (
          <div key={pillar.id} className="sol-card reveal">
            <span className="ico">{ICONS[i]}</span>
            <h3>{pillar.title}</h3>
            <p className="blurb">{pillar.description}</p>
            <ul className="sol-list">
              {pillar.deliverables.map((d) => (
                <li key={d}>
                  <span className="check"><CheckIcon /></span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Solution
