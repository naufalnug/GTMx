'use client'

import Script from 'next/script'

function CaseStudyCta() {
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
      <Script id="cal-inline-casestudy" strategy="afterInteractive">
        {`(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "initial-consultation-call", {origin:"https://app.cal.com"});
Cal.ns["initial-consultation-call"]("inline", {elementOrSelector:"#casestudy-cal-embed",config: {"layout":"month_view","useSlotsViewOnSmallScreen":"true"},calLink: "team/gtmx/initial-consultation-call",});
Cal.ns["initial-consultation-call"]("ui", {"hideEventTypeDetails":false,"layout":"month_view"});`}
      </Script>
    </div>
  );
}

export default CaseStudyCta
