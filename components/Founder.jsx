import SectionWrapper from './ui/SectionWrapper'
import './Founder.css'

const MARKETS_SERVED = [
  { flag: '\u{1F1F8}\u{1F1EC}', name: 'Singapore' },
  { flag: '\u{1F1E6}\u{1F1FA}', name: 'Australia' },
  { flag: '\u{1F1EE}\u{1F1E9}', name: 'Indonesia' },
  { flag: '\u{1F1F2}\u{1F1FE}', name: 'Malaysia' },
  { flag: '\u{1F1EF}\u{1F1F5}', name: 'Japan' },
  { flag: '\u{1F1FA}\u{1F1F8}', name: 'USA' },
]

function Founder() {
  return (
    <SectionWrapper id="about">
      <div className="founder__header">
        <span className="founder__label">// about</span>
        <h2 className="founder__title">THE PERSON BEHIND THE PIPELINE</h2>
      </div>

      <div className="founder__card">
        <div className="founder__photo">
          {/* Replace with actual headshot: <img src="/founder.jpg" alt="Naufal" /> */}
          <div className="founder__photo-placeholder">
            <span>N</span>
          </div>
        </div>

        <div className="founder__info">
          <h3 className="founder__name">Naufal</h3>
          <p className="founder__role">GTM Engineer &middot; Singapore</p>

          <p className="founder__bio">
            I&apos;ve spent years building outbound engines for B2B startups across APAC
            and globally. I started GTMx because most GTM agencies deliver slide decks — I
            build systems that actually run. Every pipeline we ship is engineered to
            generate meetings, not reports.
          </p>

          <div className="founder__links">
            <a href="https://linkedin.com/in/naufalnug" target="_blank" rel="noopener noreferrer" className="founder__link">
              LinkedIn &rarr;
            </a>
            <a href="https://x.com/naufalnug" target="_blank" rel="noopener noreferrer" className="founder__link">
              X &rarr;
            </a>
            <a href="mailto:naufal@gtmx.run" className="founder__link">
              Email &rarr;
            </a>
          </div>

          <div className="founder__markets">
            <span className="founder__markets-label">Clients worked with across:</span>
            <div className="founder__markets-list">
              {MARKETS_SERVED.map(m => (
                <span key={m.name} className="founder__market">
                  {m.flag} {m.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}

export default Founder
