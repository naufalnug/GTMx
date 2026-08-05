'use client'

import { useDeferredCalEmbed } from './useDeferredCalEmbed'

function CaseStudyCta() {
  // Deferred until the booking area nears the viewport (see the hook). Same
  // calendar and config as the previous afterInteractive inline script.
  useDeferredCalEmbed({
    namespace: 'initial-consultation-call',
    calLink: 'team/gtmx/initial-consultation-call',
    elementId: 'casestudy-cal-embed',
    ui: { hideEventTypeDetails: false, layout: 'month_view' },
  })

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
