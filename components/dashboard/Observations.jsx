import './Observations.css';

export default function Observations({ insights }) {
  if (!insights || !insights.length) return null;

  return (
    <section className="section obs-section">
      <div className="wrap">
        <div className="obs-head">
          <span className="eyebrow--code">// observations</span>
          <h2 className="h2">
            What stood out <em>this period</em>
          </h2>
        </div>

        <ol className="obs-list">
          {insights.map((insight, i) => (
            <li key={insight.kind} className="obs-item">
              <span className="obs-n">{String(i + 1).padStart(2, '0')}</span>
              <div className="obs-body">
                <span className="obs-label">{insight.label}</span>
                <p className="obs-text">{insight.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
