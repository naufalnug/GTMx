import SectionWrapper from './ui/SectionWrapper'
import { pillars } from '../data/solution'
import './Solution.css'

function Solution() {
  return (
    <SectionWrapper id="solution">
      <div className="solution__header">
        <span className="solution__label">// what_we_build</span>
        <h2 className="solution__title">
          WE DON&apos;T CONSULT. WE ENGINEER YOUR REVENUE ENGINE.
        </h2>
        <p className="solution__desc">
          GTMx designs, builds, and runs the full outbound system that gets APAC B2B
          companies qualified meetings with US and EU buyers.
        </p>
      </div>

      <div className="solution__grid">
        {pillars.map(pillar => (
          <div key={pillar.id} className="solution__card">
            <span className="solution__icon">{pillar.icon}</span>
            <h3 className="solution__card-title">{pillar.title}</h3>
            <p className="solution__card-desc">{pillar.description}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

export default Solution
