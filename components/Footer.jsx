'use client'

import { useEffect } from 'react'
import './Footer.css'

function Footer() {
  useEffect(() => {
    function initCal() {
      if (window.Cal && window.Cal.ns && window.Cal.ns["30min"]) {
        window.Cal.ns["30min"]("inline", {
          elementOrSelector: "#my-cal-inline-30min",
          config: { layout: "month_view", useSlotsViewOnSmallScreen: "true" },
          calLink: "naufal-gtmx/30min",
        });
        window.Cal.ns["30min"]("ui", { hideEventTypeDetails: false, layout: "month_view" });
        return true;
      }
      return false;
    }

    if (initCal()) return;

    // Cal.com script hasn't loaded yet — poll until ready
    const interval = setInterval(() => {
      if (initCal()) clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, []);

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
            Book a 30-minute strategy call — we work with teams across APAC and globally.
          </p>
          <p className="footer__tz-note">
            Slots available in SGT, AEST, and most APAC timezones.
          </p>
          <div className="footer__cal-embed" id="my-cal-inline-30min"></div>
          <pre className="footer__ascii">{`
  (~^.^)~  let's ship some pipeline  ~(^.^~)
          `}</pre>
        </div>

        <div className="footer__bottom">
          <span className="footer__brand">
            GTMx<span className="footer__cursor">_</span>
          </span>
          <div className="footer__links">
            <a href="https://linkedin.com/in/naufalnug" target="_blank" rel="noopener noreferrer" className="footer__link">[LinkedIn]</a>
            <a href="https://x.com/naufalnug" target="_blank" rel="noopener noreferrer" className="footer__link">[X]</a>
            <a href="mailto:naufal@gtmx.run" className="footer__link">[Email]</a>
          </div>
          <span className="footer__copy">&copy; 2026 GTMx. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
