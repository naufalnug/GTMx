import SectionWrapper from './ui/SectionWrapper'
import './Problem.css'

const MISTAKES = [
  {
    id: 'playbook',
    icon: '!>',
    title: 'Relying on What Got You Here',
    description:
      'The inbound-led, referral-driven, founder-sales motion that got your first customers doesn\u2019t scale. Structured outbound requires ROI-first messaging, engineered sequences, and infrastructure. Running the old playbook at new targets produces silence.',
  },
  {
    id: 'hire',
    icon: '$>',
    title: 'Hiring a VP of Sales Too Early',
    description:
      'A VP of Sales costs $250K+ fully loaded and takes 6 months to ramp. Most B2B companies\u2019 first senior sales hire fails \u2014 not because of the person, but because there\u2019s no repeatable process for them to execute. You need the engine before you hire the driver.',
  },
  {
    id: 'messaging',
    icon: '<>',
    title: 'Messaging Built for the Wrong Buyer',
    description:
      'Your pitch was crafted for the people you already know. New buyer segments have different pain points, different urgency triggers, and different social proof requirements. Generic messaging gets ignored \u2014 outbound messaging needs to be engineered for each ICP.',
  },
]

function Problem() {
  return (
    <SectionWrapper id="problem">
      <div className="problem__header" data-animate="fade-up">
        <span className="problem__label">// the_problem</span>
        <h2 className="problem__title">
          The 3 Mistakes That Kill Outbound Before It Starts
        </h2>
      </div>

      <div className="problem__grid" data-animate="stagger">
        {MISTAKES.map((item, i) => (
          <div key={item.id} className="problem__card">
            <span className="problem__number">0{i + 1}</span>
            <h3 className="problem__card-title">{item.title}</h3>
            <p className="problem__card-desc">{item.description}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

export default Problem
