import SectionWrapper from './ui/SectionWrapper'
import { pillars } from '../data/solution'
import './Solution.css'


function Solution() {
  return (
    <SectionWrapper id="solution">
      <div className="solution__header" data-animate="fade-up">
        <span className="solution__label">// what_we_build</span>
        <h2 className="solution__title">
          We Don&apos;t Consult. We Engineer Your Revenue Engine.
        </h2>
        <p className="solution__desc">
          GTMx designs, builds, and runs the full outbound system that gets APAC B2B
          companies qualified meetings with US and EU buyers.
        </p>
      </div>

      <div className="solution__grid" data-animate="stagger">
        {pillars.map(pillar => (
            <div key={pillar.id} className="solution__card">
              <h3 className="solution__card-title">{pillar.title}</h3>
              <p className="solution__card-desc">{pillar.description}</p>
              <ul className="solution__deliverables">
                {pillar.deliverables.map(item => (
                  <li key={item} className="solution__deliverable">{item}</li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </SectionWrapper>
  )
}

export default Solution
