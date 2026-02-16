import SectionWrapper from './ui/SectionWrapper'
import { services } from '../data/services'
import './Services.css'

function Services() {
  return (
    <SectionWrapper id="services">
      <div className="services__header">
        <span className="services__label">// services</span>
        <h2 className="services__title">WHAT WE DELIVER</h2>
        <p className="services__desc">
          Outcomes, not tactics. Every engagement is engineered around the results that matter to your business.
        </p>
        <pre className="services__ascii">{`
    ┌─────────────────────────────┐
    │  > sudo book-more-meetings  │
    │  Password: ***********      │
    │  ✓ Access granted.          │
    └─────────────────────────────┘
        `}</pre>
      </div>

      <div className="services__grid">
        {services.map(service => (
          <div key={service.id} className="services__card">
            <span className="services__icon">{service.icon}</span>
            <h3 className="services__card-title">{service.title}</h3>
            <p className="services__card-desc">{service.description}</p>
            <div className="services__card-metric">{service.metric}</div>
            <div className="services__card-tools">
              {service.tools.map(tool => (
                <span key={tool} className="services__tool-badge">{tool}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

export default Services
