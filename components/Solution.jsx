/* ──────────────────────────────────────────────
   GTMx — components/Solution.jsx
   Drop-in replacement: feature-list bullets become
   three numbered italic claims per pillar.
   ────────────────────────────────────────────── */

import './Solution.css'

const pillars = [
  {
    tag: '// pipeline_generation',
    title: 'Pipeline that compounds.',
    italic: 'compounds.',
    claims: [
      {
        em: 'Infrastructure first.',
        rest: ' Secondary domains, warmed inboxes, deliverability monitoring — your primary domain stays untouched.',
      },
      {
        em: 'Signals over spray.',
        rest: ' Intent data, hiring triggers, and tech-stack filters via Clay — not bought lists.',
      },
      {
        em: 'Iterated weekly.',
        rest: ' Multi-angle sequences, A/B tested, reply triage, bi-weekly review.',
      },
    ],
    fineprint: 'Includes domains, DNS, warmup, list building, copy, sequencing, A/B testing, deliverability monitoring, reply triage, lead handoff.',
  },
  {
    tag: '// gtm_engineering',
    title: 'GTM, engineered.',
    italic: 'engineered.',
    claims: [
      {
        em: 'Workflows that ship.',
        rest: ' Lifecycle automation, lead routing, CRM hygiene — the plumbing that lets your reps actually sell.',
      },
      {
        em: 'Data that decides.',
        rest: ' One source of truth across HubSpot / Salesforce, Clay, and your inbox tools.',
      },
      {
        em: 'Hand-off, not lock-in.',
        rest: ' We document everything. You inherit a system, not a dependency.',
      },
    ],
    fineprint: 'Includes CRM build / cleanup, Clay tables, lifecycle automation, attribution, GTM dashboarding, internal SOP docs.',
  },
]

export default function Solution() {
  return (
    <section id="solution" className="section solution">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">// what_we_do</span>
          <div>
            <h2 className="h2">Two engines.<br/><em>One system.</em></h2>
          </div>
        </div>

        <div className="solution__grid">
          {pillars.map(p => (
            <div key={p.tag} className="solution__pillar">
              <span className="solution__tag">{p.tag}</span>
              <h3 className="solution__title">
                {p.title.replace(p.italic, '')}
                <em>{p.italic}</em>
              </h3>

              <ol className="solution__claims">
                {p.claims.map((c, i) => (
                  <li key={i} className="solution__claim">
                    <span className="solution__n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="solution__t">
                      <em>{c.em}</em>{c.rest}
                    </span>
                  </li>
                ))}
              </ol>

              <p className="solution__fine">{p.fineprint}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
