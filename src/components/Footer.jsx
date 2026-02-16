import GlowButton from './ui/GlowButton'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer" id="book">
      <div className="footer__inner">
        <div className="footer__cta">
          <h2 className="footer__title">
            READY TO ENGINEER YOUR<br />
            <span className="footer__title-accent">GO-TO-MARKET PIPELINE?</span>
          </h2>
          <p className="footer__subtitle">
            Stop guessing. Start engineering.<br />
            Book a 30-minute strategy call.
          </p>
          <GlowButton href="https://calendly.com" size="lg">
            {'>>> Book Your Call'}
          </GlowButton>
          <pre className="footer__ascii">{`
  (~^.^)~  let's ship some pipeline  ~(^.^~)
          `}</pre>
        </div>

        <div className="footer__bottom">
          <span className="footer__brand">
            GTMx<span className="footer__cursor">_</span>
          </span>
          <div className="footer__links">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer__link">[LI]</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer__link">[X]</a>
            <a href="mailto:hello@gtmx.com" className="footer__link">[EMAIL]</a>
          </div>
          <span className="footer__copy">&copy; 2026 GTMx. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
