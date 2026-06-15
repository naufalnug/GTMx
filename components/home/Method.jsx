'use client'

/* ──────────────────────────────────────────────
   GTMx — components/home/Method.jsx
   The GTMx Method, tabbed by service. Same four numbered
   tiles + dashed connector across all three tabs (reinforces
   "same method, every time"); only the copy, week markers,
   and artifact mockups change. Defaults to Automated Outbound.
   Ported from the design handoff's vanilla-JS builder into
   React state. Artifact bodies keep their original markup via
   dangerouslySetInnerHTML — purely decorative, no user input.
   ────────────────────────────────────────────── */

import { useState } from 'react'

const G = '#5bbf7e' // health green

function win(t, inner) {
  return '<div class="af"><div class="af__bar"><i></i><i></i><i></i><span>' + t + '</span></div><div class="af__body">' + inner + '</div></div>'
}

const ART = {
  icp: () => win('icp_audit.clay',
    '<div class="af-row" style="font-size:8.5px;font-weight:700;color:var(--ink-soft)"><span style="flex:1">DOMAIN</span><span>HEALTH</span></div>' +
    [[G, '98'], [G, '94'], ['#EBB73E', '71'], ['#DB4C24', '42']].map(([c, n]) =>
      '<div class="af-row"><span class="af-line s"></span><span class="af-line"></span><span class="af-dot" style="background:' + c + '"></span><span class="af-chip" style="border-color:' + c + ';color:' + c + '">' + n + '</span></div>').join('')),
  sequence: () => win('sequence.json',
    ['Intro · day 1', 'Nudge · day 3', 'Break-up · day 7'].map((s, i) =>
      '<div style="border:1.5px solid var(--ink);border-radius:7px;padding:6px 7px;background:' + (i === 0 ? '#FDEAE3' : '#F4EEE2') + '"><div style="font-weight:700;font-size:8.5px">' + s + '</div><div class="af-line" style="margin-top:4px"></div><div class="af-line s" style="margin-top:3px"></div></div>').join('') +
    '<div class="af-row"><span class="af-chip" style="background:var(--mint)">Clay ✦ enriched ×2,847</span></div>'),
  inbox: () => win('inbox / live',
    [['#9AA8EC', 'Re: quick question', '#3a9b5c', 'reply'], [G, 'Interested — when?', '#3a9b5c', 'reply'], ['#EBB73E', "Let's talk Q3", '#3a9b5c', 'reply']].map(([d, s, cc, cl]) =>
      '<div class="af-row"><span class="af-dot" style="background:' + d + '"></span><span style="flex:1;font-size:9px;font-weight:600">' + s + '</span><span class="af-chip" style="border-color:' + cc + ';color:' + cc + '">' + cl + '</span></div>').join('') +
    '<div class="af-row" style="gap:4px;margin-top:2px">' + ['M', 'T', 'W', 'T', 'F'].map((d, i) =>
      '<div style="flex:1;text-align:center;border:1.5px solid var(--ink);border-radius:5px;padding:4px 0;font-size:8px;font-weight:700;background:' + (i === 2 ? 'var(--flame)' : 'var(--white)') + ';color:' + (i === 2 ? '#fff' : 'var(--ink)') + '">' + d + '</div>').join('') + '</div>' +
    '<div style="font-size:8.5px;font-weight:700;color:var(--flame)">● 3 meetings booked</div>'),
  perf: () => win('performance',
    '<svg viewBox="0 0 120 44" style="width:100%;height:44px"><polygon points="2,40 22,32 42,34 62,22 82,24 102,10 118,6 118,44 2,44" fill="#DB4C24" opacity="0.12"/><polyline points="2,40 22,32 42,34 62,22 82,24 102,10 118,6" fill="none" stroke="#DB4C24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '<div class="af-row" style="justify-content:space-between">' + [['Sent', '12.4k'], ['Replies', '318'], ['Booked', '41']].map(([l, n]) =>
      '<div><div class="af-num" style="font-size:14px">' + n + '</div><div style="font-size:7.5px;color:var(--ink-soft);font-weight:700">' + l + '</div></div>').join('') + '</div>'),
  crm: () => win('crm_audit',
    '<div class="af-row" style="gap:4px">' + [['Forms', '#C2CBF2'], ['Enrich', '#FDEAE3'], ['CRM', '#B6DEC4']].map((b, i) =>
      '<div style="flex:1;border:1.5px solid var(--ink);border-radius:6px;padding:5px 2px;text-align:center;font-size:8px;font-weight:700;background:' + b[1] + '">' + b[0] + '</div>' + (i < 2 ? '<span style="font-weight:800">→</span>' : '')).join('') + '</div>' +
    '<div style="font-size:8px;font-weight:700;color:var(--ink-soft);margin-top:2px">DATA HEALTH</div>' +
    '<div style="height:9px;border:1.5px solid var(--ink);border-radius:5px;overflow:hidden"><div style="width:58%;height:100%;background:var(--gold)"></div></div>' +
    ['Duplicates: 1,204', 'Missing enrichment: 38%'].map(s => '<div style="font-size:8.5px;font-weight:600;color:var(--ink-soft)">▸ ' + s + '</div>').join('')),
  workflow: () => win('clay × hubspot',
    [['Trigger · new lead', '#FDEAE3'], ['Enrich · Clay', '#B6DEC4'], ['Score & dedupe', '#FFE9AE'], ['Route → CRM', '#C2CBF2']].map((n, i) =>
      '<div style="border:1.5px solid var(--ink);border-radius:7px;padding:5px 8px;font-size:8.5px;font-weight:700;background:' + n[1] + '">' + n[0] + '</div>' + (i < 3 ? '<div style="text-align:center;font-weight:800;font-size:10px;line-height:.5">↓</div>' : '')).join('')),
  hubspot: () => win('hubspot / live',
    '<div class="af-row" style="align-items:flex-end;height:38px;gap:5px">' + [60, 90, 45, 75, 55].map((h, i) =>
      '<div style="flex:1;height:' + h + '%;border:1.5px solid var(--ink);border-radius:4px 4px 0 0;background:' + ['#9AA8EC', '#DB4C24', '#B6DEC4', '#EBB73E', '#C49AD2'][i] + '"></div>').join('') + '</div>' +
    ['ICP A → AE 1', 'ICP B → AE 2'].map(s => '<div class="af-row"><span class="af-dot" style="background:var(--flame)"></span><span style="font-size:8.5px;font-weight:600">' + s + '</span></div>').join('')),
  scoring: () => win('lead_scoring',
    [['92', '#DB4C24'], ['78', '#EBB73E'], ['61', '#9AA8EC'], ['40', '#B6DEC4']].map(([n, c]) =>
      '<div class="af-row"><div style="flex:1;height:8px;border:1.5px solid var(--ink);border-radius:4px;overflow:hidden"><div style="width:' + n + '%;height:100%;background:' + c + '"></div></div><span class="af-num" style="font-size:11px;width:22px;text-align:right">' + n + '</span></div>').join('') +
    '<div style="font-size:8.5px;font-weight:700;color:var(--ink-soft);margin-top:3px">▸ v2.3 — routing model updated</div>'),
  visibility: () => win('visibility_audit',
    '<div class="af-row" style="align-items:flex-end;height:38px;gap:4px">' + [30, 55, 80, 40, 68, 25].map((h, i) =>
      '<div style="flex:1;height:' + h + '%;border:1.5px solid var(--ink);border-radius:3px 3px 0 0;background:' + (i % 2 ? '#B6DEC4' : '#C2CBF2') + '"></div>').join('') + '</div>' +
    ['"gtm engineering" — gap', '"clay agency" — pos 8'].map(s => '<div style="font-size:8.5px;font-weight:600;color:var(--ink-soft)">▸ ' + s + '</div>').join('')),
  cluster: () => win('content_map',
    '<svg viewBox="0 0 130 100" style="width:100%;height:100px" stroke="#1A1712" stroke-width="1.4" fill="none">' +
    '<line x1="65" y1="50" x2="24" y2="22"/><line x1="65" y1="50" x2="108" y2="24"/><line x1="65" y1="50" x2="22" y2="80"/><line x1="65" y1="50" x2="106" y2="78"/>' +
    '<circle cx="65" cy="50" r="15" fill="#FFE9AE"/><circle cx="24" cy="22" r="8.5" fill="#B6DEC4"/><circle cx="108" cy="24" r="8.5" fill="#C2CBF2"/><circle cx="22" cy="80" r="8.5" fill="#F6B7A2"/><circle cx="106" cy="78" r="8.5" fill="#C49AD2"/></svg>'),
  citation: () => win('citation_tracker',
    [['#1', '"gtm engineering"'], ['#3', '"outbound agency"'], ['#5', '"revops service"']].map(([r, k]) =>
      '<div class="af-row"><span class="af-chip" style="background:var(--mint)">' + r + '</span><span style="font-size:8.5px;font-weight:600;flex:1">' + k + '</span></div>').join('') +
    '<div class="af-row" style="flex-wrap:wrap;gap:4px;margin-top:3px">' + [['ChatGPT', '#D9F2E4'], ['Claude', '#FDEAE3'], ['Perplexity', '#E5E0FA'], ['Gemini', '#DCEBFB']].map(m =>
      '<span class="af-chip" style="background:' + m[1] + '">✓ ' + m[0] + '</span>').join('') + '</div>'),
  seodash: () => win('seo_performance',
    '<svg viewBox="0 0 120 40" style="width:100%;height:40px"><polyline points="2,36 24,30 46,26 68,18 90,14 118,6" fill="none" stroke="#5bbf7e" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '<div class="af-row" style="justify-content:space-between">' + [['Clicks', '8.1k'], ['Cites', '62'], ['Demos', '19']].map(([l, n]) =>
      '<div><div class="af-num" style="font-size:13px">' + n + '</div><div style="font-size:7.5px;color:var(--ink-soft);font-weight:700">' + l + '</div></div>').join('') + '</div>'),
}

const METHOD = [
  { id: 'outbound', label: 'Automated Outbound', steps: [
    { week: 'Week 1', title: 'Audit', body: 'We map your ICP, domain health, outbound stack, and reply data — then show you exactly where pipeline is leaking. Most teams find their messaging works fine; their infrastructure is killing it.', art: 'icp', cap: 'ICP + deliverability audit' },
    { week: 'Weeks 2–3', title: 'Build', body: 'We engineer the stack: warmed secondary domains, sending infrastructure, intent-based lists in Clay, sequences written for your buyer, and LinkedIn profiles optimized for replies.', art: 'sequence', cap: 'Sequence preview + Clay enrichment table' },
    { week: 'Weeks 3–4', title: 'Launch', body: 'Campaigns go live across cold email and LinkedIn at once. We manage replies, qualify leads, and book meetings into your calendar — first meetings usually land within 30 days.', art: 'inbox', cap: 'Live inbox + booked-meeting calendar' },
    { week: 'Month 2+', title: 'Iterate', body: "Weekly tuning on what's converting — copy variants, segment performance, reply quality — so output compounds month over month instead of plateauing.", art: 'perf', cap: 'Weekly performance dashboard' },
  ] },
  { id: 'revops', label: 'RevOps', steps: [
    { week: 'Week 1', title: 'Audit', body: 'We map your CRM, data flow, enrichment coverage, and routing logic — then show you where deals stall, where data is rotting, and where your team is doing work the system should do.', art: 'crm', cap: 'CRM health + data-flow audit' },
    { week: 'Weeks 2–4', title: 'Build', body: 'We engineer the system: Clay enrichment workflows, lead scoring, dedup, inbound routing, and a HubSpot or Salesforce setup that runs itself. Your team stops doing data hygiene and starts selling.', art: 'workflow', cap: 'Clay × HubSpot workflow diagram' },
    { week: 'Weeks 4–6', title: 'Launch', body: 'We switch the system on end-to-end and train your team. New leads get scored, routed, and enriched automatically. Dashboards go live so revenue, marketing, and ops see the same numbers.', art: 'hubspot', cap: 'Live HubSpot dashboard + routing rules' },
    { week: 'Month 2+', title: 'Iterate', body: 'Weekly reviews on what the system catches, misses, and surfaces. We tune the scoring model, refine routing, and ship new workflows as your motion evolves.', art: 'scoring', cap: 'Scoring model + workflow changelog' },
  ] },
  { id: 'search', label: 'Search', steps: [
    { week: 'Week 1', title: 'Audit', body: 'We audit technical SEO, content coverage, backlinks, and your visibility across Google and AI answer engines (ChatGPT, Claude, Perplexity, Gemini). You see where you rank, where you don’t, and where the opportunity is.', art: 'visibility', cap: 'Visibility audit + keyword gap report' },
    { week: 'Weeks 2–4', title: 'Build', body: 'We engineer the content engine: programmatic templates, keyword clusters mapped to buyer intent, technical fixes shipped, and briefs written for both search engines and LLMs. We build for citations, not just rankings.', art: 'cluster', cap: 'Content cluster map + page template' },
    { week: 'Weeks 4–6', title: 'Launch', body: 'Pages ship at scale and technical SEO goes live. We monitor indexation, rankings, and AI citations from day one — tracking when ChatGPT, Claude, Perplexity, and Gemini start citing you.', art: 'citation', cap: 'Rankings + AI citation tracker' },
    { week: 'Month 2+', title: 'Iterate', body: "Weekly tuning on what's ranking, getting cited, and converting. We double down on winners, refresh decayers, and expand into adjacent clusters as authority builds.", art: 'seodash', cap: 'Performance + citation dashboard' },
  ] },
]

export default function Method() {
  const [active, setActive] = useState(METHOD[0].id)

  return (
    <section className="section" id="method">
      <div className="sec-head">
        <h2 className="h2">The <span className="hl">GTMx Method.</span></h2>
        <p className="sec-lede">One repeatable loop behind every engagement &mdash; same four moves whether we&apos;re building outbound, RevOps, or search. No mystery, no retainer black box.</p>
      </div>

      <div className="method-tabs">
        {METHOD.map(svc => (
          <button
            key={svc.id}
            type="button"
            className={'mtab' + (active === svc.id ? ' is-active' : '')}
            onClick={() => setActive(svc.id)}
          >
            <span className="mtab__dot"></span>{svc.label}
          </button>
        ))}
      </div>

      <div>
        {METHOD.map(svc => (
          <div key={svc.id} className={'mpanel' + (active === svc.id ? ' is-active' : '')}>
            <div className="mtrack">
              {svc.steps.map((st, i) => (
                <div className="mstep" key={i}>
                  <div className="mstep__tile">{i + 1}</div>
                  <span className="mstep__week">{st.week}</span>
                  <h3 className="mstep__title">{st.title}</h3>
                  <p className="mstep__body">{st.body}</p>
                  <div className="mstep__art" dangerouslySetInnerHTML={{ __html: ART[st.art]() }} />
                  <div className="mstep__artcap">{st.cap}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
