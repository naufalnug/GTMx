import SectionWrapper from './ui/SectionWrapper'
import './Problem.css'

const MISTAKES = [
  {
    id: 'playbook',
    icon: '!>',
    title: 'Copying What Worked in APAC',
    description:
      'The relationship-first, referral-led, channel-driven sales motion that built your APAC revenue doesn\u2019t work in the US. American B2B buyers expect structured outbound, ROI-first messaging, and speed. APAC playbooks produce silence.',
  },
  {
    id: 'hire',
    icon: '$>',
    title: 'Hiring a US VP of Sales Too Early',
    description:
      'A US VP of Sales costs $250K+ fully loaded and takes 6 months to ramp. Most APAC companies\u2019 first US hire fails \u2014 not because of the person, but because there\u2019s no repeatable process for them to execute. You need the engine before you hire the driver.',
  },
  {
    id: 'messaging',
    icon: '<>',
    title: 'Messaging Built for APAC Buyers',
    description:
      'Your pitch was crafted to resonate in Singapore, Sydney, or Bangalore. US and European buyers have different pain points, different urgency triggers, and different social proof requirements. The same words land differently on the other side of the world.',
  },
]

function Problem() {
  return (
    <SectionWrapper id="problem">
      <div className="problem__header">
        <span className="problem__label">// the_problem</span>
        <h2 className="problem__title">
          THE 3 MISTAKES THAT KILL APAC EXPANSION BEFORE IT STARTS
        </h2>
      </div>

      <div className="problem__grid">
        {MISTAKES.map((item, i) => (
          <div key={item.id} className="problem__card">
            <span className="problem__number">0{i + 1}</span>
            <span className="problem__icon">{item.icon}</span>
            <h3 className="problem__card-title">{item.title}</h3>
            <p className="problem__card-desc">{item.description}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

export default Problem
