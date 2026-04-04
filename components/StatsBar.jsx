import './StatsBar.css'

const stats = [
  { number: '50+', label: 'Pipelines Built' },
  { number: '10,000+', label: 'Leads Enriched' },
  { number: '3-5x', label: 'Avg. Productivity Gain' },
  { number: '90 days', label: 'To First Results' },
]

function StatsBar() {
  return (
    <section className="stats-bar">
      <div className="stats-bar__inner">
        {stats.map((stat, i) => (
          <div key={i} className="stats-bar__item">
            <span className="stats-bar__number">{stat.number}</span>
            <span className="stats-bar__label">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default StatsBar
