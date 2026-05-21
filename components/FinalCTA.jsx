'use client'

import Script from 'next/script'
import './FinalCTA.css'

function FinalCTA() {
  return (
    <section id="book" className="section dark final-cta">
      <div className="wrap">
        <span className="eyebrow">Free GTM Audit &middot; 30 min</span>
        <h2 className="display" style={{ marginTop: 24 }}>
          Ready to Build Your <em>Outbound Revenue Engine?</em>
        </h2>
        <p className="lede">
          Book a free GTM Audit. We&apos;ll map out exactly what it would take to get
          your first qualified pipeline. No pitch, no fluff.
        </p>
        <div className="final-cta-embed" id="my-cal-inline-initial-consultation-call"></div>
        <Script id="cal-inline-initial-consultation-call" strategy="afterInteractive">
          {`(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "initial-consultation-call", {origin:"https://app.cal.com"});
Cal.ns["initial-consultation-call"]("inline", {elementOrSelector:"#my-cal-inline-initial-consultation-call",config: {"layout":"month_view","useSlotsViewOnSmallScreen":"true"},calLink: "team/gtmx/initial-consultation-call",});
Cal.ns["initial-consultation-call"]("ui", {"hideEventTypeDetails":false,"layout":"month_view"});`}
        </Script>
        <div className="stamp">&mdash; No obligations &middot; No sales pitch &middot; Just clarity &middot;</div>
      </div>
    </section>
  )
}

export default FinalCTA
