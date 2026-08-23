export default function TrendChart({ points }) {
  const view = points.slice(-30);
  const max = Math.max(...view.map((point) => point.sent), 1);
  if (!view.length) return <div className="chart-empty"><span>No sending activity in this period.</span></div>;
  return <div className="trend-chart" role="img" aria-label="Daily email sending volume for the selected period">{view.map((point) => <div className="trend-column" key={point.date} title={`${point.date}: ${point.sent} sent, ${point.replies} replies`}><span className="trend-replies" style={{ height: `${Math.max((point.replies / max) * 100, point.replies ? 3 : 0)}%` }} /><span className="trend-sent" style={{ height: `${Math.max((point.sent / max) * 100, 2)}%` }} /></div>)}</div>;
}
