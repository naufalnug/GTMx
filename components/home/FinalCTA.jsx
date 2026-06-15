'use client'

/* ──────────────────────────────────────────────
   GTMx — components/home/FinalCTA.jsx
   Bold vermillion close panel. "Book your free audit"
   opens the Cal.com popup (team/gtmx/initial-consultation-call) —
   same booking flow as the rest of the site, kept as a popup
   so it doesn't break the panel layout.
   ────────────────────────────────────────────── */

import Script from 'next/script'

const CAL_NS = 'initial-consultation-call'
const CAL_LINK = 'team/gtmx/initial-consultation-call'

export default function FinalCTA() {
  return (
    <section className="final" id="book">
      <Script id="cal-popup-initial-consultation-call" strategy="afterInteractive">
        {`(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "${CAL_NS}", {origin:"https://app.cal.com"});
Cal.ns["${CAL_NS}"]("ui", {"hideEventTypeDetails":false,"layout":"month_view"});`}
      </Script>

      <div className="final-panel">
        <span className="final-blob" style={{ width: 200, height: 200, background: 'var(--sky)', top: -50, left: -40 }}></span>
        <span className="final-blob" style={{ width: 160, height: 160, background: 'var(--gold)', bottom: -50, right: -30 }}></span>
        <span className="final-eyebrow">Free GTM audit &middot; 30 min</span>
        <h2>Ready to build your <span className="u">engine?</span></h2>
        <p>We&apos;ll map exactly what it takes to get your first qualified pipeline &mdash; outbound, RevOps, and search. No pitch, no fluff.</p>
        <div className="final-actions">
          <button
            type="button"
            className="btn-cream"
            data-cal-namespace={CAL_NS}
            data-cal-link={CAL_LINK}
            data-cal-config='{"layout":"month_view"}'
          >
            Book your free audit
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
          </button>
          <a href="#work" className="btn-outline-cream">See the work</a>
        </div>
        <p className="final-stamp">— No obligations &middot; no sales pitch &middot; just clarity —</p>
      </div>
    </section>
  )
}
