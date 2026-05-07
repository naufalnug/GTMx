import { caseStudies } from '../data/caseStudies'
import './ProofStrip.css'

const clients = caseStudies.map(cs => ({
  nm: cs.company.replace(' Systems', ''),
  cat: cs.vertical.split(' · ')[0].split(' / ')[0],
}))

function ProofStrip() {
  return (
    <section className="proof-strip">
      <div className="wrap proof-grid">
        <div className="label">Clients shipping pipeline with us</div>
        {clients.map((c) => (
          <div key={c.nm} className="client-mark">
            <span className="nm">{c.nm}</span>
            <span className="cat">{c.cat}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ProofStrip
