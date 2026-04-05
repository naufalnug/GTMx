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
            READY TO BUILD YOUR<br />
            <span className="footer__title-accent">US REVENUE ENGINE?</span>
          </h2>
          <p className="footer__subtitle">
            Book a free GTM Audit. We&apos;ll map out exactly what it would take to get<br />
            your first qualified US or European pipeline — no pitch, no fluff.
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
            <a href="/content" className="footer__link">[Content]</a>
            <a href="https://linkedin.com/company/gtmx" target="_blank" rel="noopener noreferrer" className="footer__link">[LinkedIn]</a>
            <a href="https://x.com/gtmxrun" target="_blank" rel="noopener noreferrer" className="footer__link">[X]</a>
            <a href="mailto:hello@gtmx.run" className="footer__link">[Email]</a>
          </div>
          <span className="footer__copy">GTMx — Revenue engineering for APAC companies going West. &copy; 2026</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
