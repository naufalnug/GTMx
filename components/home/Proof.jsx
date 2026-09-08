/* ──────────────────────────────────────────────
   GTMx — components/home/Proof.jsx
   Periwinkle proof band — real numbers + client engines.
   ────────────────────────────────────────────── */

export default function Proof() {
  return (
    <section className="proof-sec" id="results">
      <div className="proof">
        <div className="proof__top">
          <span className="proof__kicker"><span className="d"></span>The receipts</span>
          <span className="proof__rule"></span>
        </div>
        <div className="proof__stats">
          <div className="proof__stat proof__stat--lead"><span className="proof__num is-flame">$4M+</span><span className="proof__lab">pipeline attributed</span></div>
          <div className="proof__stat"><span className="proof__num">1M+</span><span className="proof__lab">emails sent</span></div>
          <div className="proof__stat"><span className="proof__num">5000+</span><span className="proof__lab">MQLs generated</span></div>
          <div className="proof__stat"><span className="proof__num">100%</span><span className="proof__lab">referral close rate</span></div>
        </div>
        <div className="proof__clients">
          <span className="lab">Built engines for</span>
          <span className="proof__client"><i style={{ background: 'var(--flame)' }}></i>OpenSponsorship</span>
          <span className="proof__client"><i style={{ background: 'var(--sky-2)' }}></i>Strategy Achievers</span>
          <span className="proof__client"><i style={{ background: 'var(--gold)' }}></i>Vidify</span>
          <span className="proof__client"><i style={{ background: 'var(--mint-2)' }}></i>United Safety</span>
        </div>
      </div>
    </section>
  )
}
