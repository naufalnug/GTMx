import './ProofStrip.css'

const proofPoints = [
  { num: '10+ yrs', label: 'in GTM' },
  { num: '5M+',     label: 'emails sent' },
  { num: '$4M+',    label: 'pipeline attributed' },
  { num: '100%',    label: 'referral close rate' },
]

const clients = [
  { name: 'OpenSponsorship', sub: 'Athlete marketing platform' },
  { name: 'Strategy Achievers', sub: 'Personal branding agency' },
  { name: 'Metatron Concepts (Vidify)', sub: 'B2B social media' },
  { name: 'United Safety Training', sub: 'Violence prevention services' },
]

export default function ProofStrip() {
  return (
    <section className="proofband dark">
      <div className="wrap">

        <div className="proofband__row">
          <span className="proofband__label">// proof_points</span>
          <div className="proofband__stats">
            {proofPoints.map(p => (
              <div key={p.num} className="proofband__stat">
                <span className="proofband__num">{p.num}</span>
                <span className="proofband__sub">{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="proofband__rule" />

        <div className="proofband__row">
          <span className="proofband__label">// shipping_with</span>
          <div className="proofband__clients">
            {clients.map(c => (
              <div key={c.name} className="proofband__client">
                <span className="proofband__client-name">{c.name}</span>
                <span className="proofband__client-sub">{c.sub}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
