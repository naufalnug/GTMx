/* ──────────────────────────────────────────────
   GTMx — data/services.js
   Single source of truth for the three service detail pages
   (app/services/[slug]/page.jsx). Ported from the Daydream
   design handoff (service-data.js). Fields h1 / subhead /
   problem / proof contain inline HTML (rendered via
   dangerouslySetInnerHTML); icon is the inner markup of an
   <svg> (stroke set by the page).
   ────────────────────────────────────────────── */

export const services = [
  {
    slug: 'automated-outbound',
    name: 'Automated Outbound',
    theme: 'svc-outbound',
    blurb: 'Cold email + LinkedIn campaigns that book meetings — built, launched, and run end to end.',
    kicker: 'Automated Outbound',
    icon: '<rect x="7" y="11" width="30" height="22" rx="4"/><path d="M7 14 l15 11 15-11"/>',
    h1: 'Booked meetings, <span class="hl hl--accent">on autopilot.</span>',
    subhead: 'We co-build the outbound system that books meetings for you &mdash; cold email and LinkedIn, engineered, launched, and run end to end.',
    problem: 'Most outbound stalls for the same reasons: burned domains, bought lists, and copy that reads like everyone else\u2019s. You spin up a tool, blast a few thousand contacts, watch deliverability tank, and conclude outbound doesn\u2019t work. It does &mdash; but only as a <strong>system</strong>, not a one-off campaign. We build that system and run it, so pipeline becomes a process instead of a scramble.',
    included: [
      { title: 'Email Infrastructure', desc: 'Secondary domains, warmed inboxes, SPF/DKIM/DMARC, and ongoing deliverability monitoring. Your primary domain stays untouched.' },
      { title: 'Targeting & Data', desc: 'ICP and TAM modeling, list building, and enrichment in Clay \u2014 scored and prioritized on real intent and fit signals, not bought lists.' },
      { title: 'Personalized Copy', desc: 'Multi-angle sequences written with AI and edited by humans, A/B tested every cycle so the message keeps getting sharper.' },
      { title: 'Multi-Channel Distribution', desc: 'Cold email and LinkedIn running together \u2014 launched, monitored, reply-triaged, and synced cleanly into your CRM.' },
    ],
    process: [
      { title: 'Build', desc: 'Week 1 \u2014 kick-off, email infrastructure, ICP research, target account list, Clay setup, and first-round copy.' },
      { title: 'Launch', desc: 'Week 2 \u2014 finalize copy, push campaigns live, and start the feedback loop on replies and deliverability.' },
      { title: 'Iterate', desc: 'Week 3 onward \u2014 new plays, data review, and weekly iteration on targeting and messaging as results come in.' },
    ],
    proof: 'Every campaign is engineered to turn outbound motion into <em>booked calls</em> \u2014 infrastructure, targeting, copy, and iteration handled for you, with reporting you can actually read.',
    faq: [
      { q: 'What do I actually get?', a: 'A done-for-you outbound engine: email infrastructure, targeting and enriched data, personalized multi-channel copy, and managed campaigns across cold email and LinkedIn \u2014 plus reply triage, CRM sync, and reporting. An extension of your team you don\u2019t have to micro-manage.' },
      { q: 'How fast can we launch?', a: 'Typically around three weeks. Week one is infrastructure and research, week two is copy and go-live, and from week three we\u2019re iterating on live results.' },
      { q: 'Who is this for?', a: 'B2B companies that have already proven product-market fit, can follow up on leads quickly, and have a large enough market to sustain outbound \u2014 generally a TAM north of ~20k accounts and an average deal value worth a meeting.' },
      { q: 'Will this hurt my main domain?', a: 'No. All sending runs on dedicated secondary domains that are warmed and monitored, so your primary domain and reputation stay completely insulated.' },
    ],
  },
  {
    slug: 'revops',
    name: 'RevOps',
    theme: 'svc-revops',
    blurb: 'GTM engineering as a service — TAM sourcing, enrichment, lead scoring, and a CRM that runs itself.',
    kicker: 'RevOps \u00b7 GTM engineering',
    icon: '<circle cx="13" cy="22" r="5"/><circle cx="31" cy="12" r="5"/><circle cx="31" cy="32" r="5"/><path d="M17.5 19.5 26.5 14M17.5 24.5 26.5 30"/>',
    h1: 'A CRM that <span class="hl hl--accent">runs itself.</span>',
    subhead: 'Custom Clay and HubSpot builds that give your sales and marketing team the GTM infrastructure they\u2019re missing &mdash; sourcing, enrichment, scoring, and routing, automated.',
    problem: 'Your CRM is half-trusted, your data lives in five places, and someone on the team still spends hours every week copying records and chasing enrichment by hand. Meanwhile the pre-AI playbooks everyone learned are quietly going obsolete. RevOps is the plumbing that fixes this &mdash; a <strong>single source of truth</strong> and the automation that lets your reps actually sell instead of maintaining spreadsheets.',
    included: [
      { title: 'TAM Sourcing', desc: 'Build and segment your total addressable market into clean, prioritized account lists your team can act on.' },
      { title: 'Inbound Orchestration', desc: 'Form fills and sign-ups enriched, scored, qualified, and routed in seconds \u2014 automatically, the moment they land.' },
      { title: 'CRM Enrichment', desc: 'Keep HubSpot or Salesforce clean and complete with Clay and 120+ data providers wired into your stack.' },
      { title: 'Lead Scoring', desc: 'Surface the accounts and contacts most likely to convert so sales spends its time where it pays off.' },
    ],
    process: [
      { title: 'Audit', desc: 'We map your current GTM stack, data, and workflows \u2014 and find where revenue is leaking to manual work.' },
      { title: 'Build', desc: 'We design and ship the workflows: enrichment, scoring, routing, and CRM automation, powered by Clay and your CRM.' },
      { title: 'Hand-off', desc: 'We document everything and hand you a system, not a dependency. Hand-off, not lock-in.' },
    ],
    proof: 'The outcome is simple: every inbound and sourced contact <em>enriched, scored, and routed automatically</em> \u2014 so your team works the right accounts instead of the data.',
    faq: [
      { q: 'How do engagements work?', a: 'Two ways. Scoped sprint projects for a specific use case \u2014 TAM sourcing, inbound orchestration, CRM enrichment, or a HubSpot build \u2014 or GTM Engineering as a service, an ongoing subscription with dedicated engineers who adapt to your priorities week to week.' },
      { q: 'Who is RevOps best suited for?', a: 'Tech companies roughly between Seed and Series C, or service businesses with a real sales motion, that need GTM infrastructure built and lack the internal bandwidth to build it well.' },
      { q: 'What tools do you work in?', a: 'Clay as the engine, connected to HubSpot or Salesforce, plus the 120+ data providers and the rest of your inbox and outreach stack. We work in your tools \u2014 you keep everything.' },
      { q: 'Why invest in RevOps now?', a: 'Teams using AI in their revenue operations move faster than the ones still doing it by hand. The right system can replace hundreds of manual hours a month and make the difference between guessing and knowing who to work next.' },
    ],
  },
  {
    slug: 'seo-aeo',
    name: 'SEO + AEO',
    theme: 'svc-search',
    blurb: 'Rank on Google and get cited by AI answer engines — ChatGPT, Claude, Perplexity, and Gemini.',
    kicker: 'SEO + AEO \u00b7 search & answer engines',
    icon: '<circle cx="20" cy="20" r="11"/><path d="M28 28 35 35"/><path d="M20 13 l1.6 3.4 3.4 1.6 -3.4 1.6 -1.6 3.4 -1.6 -3.4 -3.4 -1.6 3.4 -1.6 z" stroke-width="1.4"/>',
    h1: 'Be the <span class="hl hl--accent">default answer.</span>',
    subhead: 'Rank on Google and get cited by AI answer engines &mdash; so you\u2019re the answer when buyers search, and when they ask ChatGPT, Claude, Perplexity, or Gemini.',
    problem: 'Buyer research has moved. A growing share of it now starts inside an AI tool, not a search bar &mdash; and the content most agencies ship is tuned for old Google, invisible to ChatGPT, Claude, Perplexity, and Gemini. The result is familiar: months of content, a couple of pages that rank, traffic that doesn\u2019t convert, and <strong>zero citations</strong> where the buying decision actually starts. We optimize for both at once.',
    included: [
      { title: 'Technical SEO', desc: 'The foundation: site architecture, Core Web Vitals, crawlability, and schema \u2014 fix what quietly caps your growth.' },
      { title: 'Content at Scale', desc: 'Thoroughly researched content via a human-in-the-loop AI workflow, built on a citable framework and aimed at high-intent, buy-ready queries.' },
      { title: 'Answer Engine Optimization', desc: 'Entity and knowledge-graph work, structured data, and content engineered for AI to cite \u2014 so you show up inside the answers, not just the links.' },
      { title: 'Authority & Citations', desc: 'Digital PR, community and Reddit presence, and the trusted sources AI models pull from \u2014 plus tracking that ties rankings and LLM citations back to pipeline.' },
    ],
    process: [
      { title: 'Audit', desc: 'Map where you stand on both fronts \u2014 technical SEO, content gaps, and how AI engines talk about your category versus competitors.' },
      { title: 'Query Mapping', desc: 'Identify the exact searches and AI questions your ICP uses when ready to evaluate \u2014 every target tied to commercial intent.' },
      { title: 'Technical Foundation', desc: 'Fix the 20% of technical issues that move the business \u2014 crawlability, speed, structured data \u2014 while content runs in parallel.' },
      { title: 'Content Production', desc: 'Ship content built to rank and to be cited: optimized for search engines, LLMs, and the buyers who actually convert.' },
      { title: 'Authority & Citations', desc: 'Earn high-quality links and build presence in the forums, publications, and knowledge sources that AI models trust.' },
      { title: 'Optimization', desc: 'Monitor rankings and AI citations, refresh content, and adapt to algorithm and model changes \u2014 never \u201cset and forget.\u201d' },
    ],
    proof: 'Built to capture high-intent search and AI citations that <em>turn into pipeline</em> \u2014 not vanity pageviews. We track rankings, LLM mentions, and the demo requests they drive.',
    faq: [
      { q: 'How is AEO different from SEO?', a: 'SEO is about ranking in traditional search \u2014 content, technical health, and authority. AEO is about being the answer AI gives: entity relationships, factual accuracy, structured data, and citation-ready content that ChatGPT, Claude, Perplexity, and Google\u2019s AI Overviews will reference. We do both, because buyers now use both.' },
      { q: 'Which AI platforms do you optimize for?', a: 'ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews \u2014 plus emerging answer engines as they gain real buyer traffic.' },
      { q: 'How quickly will we see results?', a: 'AI visibility tends to move first \u2014 often within the first week or two. Meaningful organic traffic builds by around month three, with significant pipeline impact compounding from month six onward.' },
      { q: 'How do you measure success?', a: 'By what actually matters: organic demo requests and pipeline, plus AI citation frequency and share of voice. We track rankings, traffic, and domain authority too \u2014 but always tied back to revenue, not pageviews.' },
    ],
  },
]
