import './CampaignTable.css';

function formatInt(n) {
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

function formatPct(n) {
  return `${n.toFixed(2)}%`;
}

export default function CampaignTable({ campaigns }) {
  const bestCampaign = campaigns
    .filter((c) => c.sent >= 100 && c.replyRate > 0)
    .sort((a, b) => b.replyRate - a.replyRate)[0];
  const bestId = bestCampaign?.id;

  return (
    <section id="campaigns" className="section ctable-section">
      <div className="wrap">
        <div className="ctable-head">
          <span className="eyebrow--code">// campaigns_by_volume</span>
          <h2 className="h2">
            Active <em>campaigns</em>
          </h2>
        </div>

        <div className="card ctable-card">
          <div className="ctable-scroll">
            <table className="ctable">
              <thead>
                <tr>
                  <th className="ctable__num-col">#</th>
                  <th>Campaign</th>
                  <th className="ctable__steps-col">Steps</th>
                  <th className="ctable__num-col">Sent</th>
                  <th className="ctable__num-col">Replies</th>
                  <th className="ctable__num-col">Interested</th>
                  <th className="ctable__num-col">Reply %</th>
                  <th className="ctable__num-col">Bounce %</th>
                  <th className="ctable__num-col">Complete</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => {
                  const isBest = c.id === bestId;
                  return (
                    <tr key={c.id}>
                      <td className="ctable__num">{i + 1}</td>
                      <td className="ctable__name">
                        <a href={`#campaign-${c.id}`}>{c.name}</a>
                      </td>
                      <td className="ctable__num">{c.steps.length}</td>
                      <td className="ctable__num">{formatInt(c.sent)}</td>
                      <td className="ctable__num">{formatInt(c.replies)}</td>
                      <td className="ctable__num ctable__interested">{formatInt(c.interested)}</td>
                      <td className={`ctable__num ctable__rate${isBest ? ' ctable__rate--best' : ''}`}>
                        {formatPct(c.replyRate)}
                      </td>
                      <td className="ctable__num ctable__muted">{formatPct(c.bounceRate)}</td>
                      <td className="ctable__num ctable__muted">{formatPct(c.completion)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
