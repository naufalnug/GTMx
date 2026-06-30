'use client'

import { useCalEmbed } from '../lib/useCalEmbed'

function CaseStudyCta() {
  // Defer the Cal.com embed until the booking element nears the viewport.
  useCalEmbed({ elementId: 'casestudy-cal-embed' })

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
