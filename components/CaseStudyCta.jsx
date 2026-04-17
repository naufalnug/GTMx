'use client'

import { useEffect } from 'react'

function CaseStudyCta() {
  useEffect(() => {
    function initCal() {
      if (window.Cal && window.Cal.ns && window.Cal.ns["30min"]) {
        window.Cal.ns["30min"]("inline", {
          elementOrSelector: "#casestudy-cal-embed",
          config: { layout: "month_view", useSlotsViewOnSmallScreen: "true", theme: "light" },
          calLink: "naufal-gtmx/30min",
        });
        window.Cal.ns["30min"]("ui", { theme: "light", hideEventTypeDetails: false, layout: "month_view" });
        return true;
      }
      return false;
    }

    if (initCal()) return;

    const interval = setInterval(() => {
      if (initCal()) clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="casestudy__cta">
      <h2 className="casestudy__cta-title">
        Want Results Like These?
      </h2>
      <p className="casestudy__cta-text">
        Book a free GTM audit. We&apos;ll map out exactly how to build a pipeline
        that generates qualified leads on autopilot.
      </p>
      <div className="casestudy__cal-embed" id="casestudy-cal-embed"></div>
    </div>
  );
}

export default CaseStudyCta
