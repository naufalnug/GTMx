/* ──────────────────────────────────────────────
   GTMx — data/services.js
   Single source of truth for the Services section
   (components/Services.jsx) AND the dedicated
   service pages (app/services/[slug]/page.jsx).

   Card fields:   slug, tag, title, blurb, icon
   Page fields:   hero, problem, included[], process[], proof, faq[]
   Edit copy here and it updates everywhere.
   ────────────────────────────────────────────── */

export const services = [
  {
    slug: 'automated-outbound',
    tag: '// automated_outbound',
    title: 'Automated Outbound',
    blurb: 'Cold email + LinkedIn campaigns that book meetings — built, launched, and run end to end.',
    icon: 'mail',

    hero: {
      eyebrow: '// automated_outbound',
      title: 'Automated Outbound',
      subhead: 'We co-build the outbound system that books meetings for you — cold email and LinkedIn, end to end.',
    },
    problem:
      'Most outbound stalls for the same reasons: burned domains, bought lists, and copy that reads like everyone else’s. You spin up a tool, blast a few thousand contacts, watch deliverability tank, and conclude outbound doesn’t work. It does — but only as a system, not a one-off campaign. We build that system and run it, so pipeline becomes a process instead of a scramble.',
    included: [
      { title: 'Email Infrastructure', desc: 'Secondary domains, warmed inboxes, SPF/DKIM/DMARC, and ongoing deliverability monitoring. Your primary domain stays untouched.' },
      { title: 'Targeting & Data', desc: 'ICP and TAM modeling, list building, and enrichment in Clay — scored and prioritized on real intent and fit signals, not bought lists.' },
      { title: 'Personalized Copy', desc: 'Multi-angle sequences written with AI and edited by humans, A/B tested every cycle so the message keeps getting sharper.' },
      { title: 'Multi-Channel Distribution', desc: 'Cold email and LinkedIn running together — launched, monitored, reply-triaged, and synced cleanly into your CRM.' },
    ],
    process: [
      { title: 'Build', desc: 'Week 1 — kick-off, email infrastructure, ICP research, target account list, Clay setup, and first-round copy.' },
      { title: 'Launch', desc: 'Week 2 — finalize copy, push campaigns live, and start the feedback loop on replies and deliverability.' },
      { title: 'Iterate', desc: 'Week 3 onward — new plays, data review, and weekly iteration on targeting and messaging as results come in.' },
    ],
    proof:
      'Every campaign is engineered to turn outbound motion into booked calls — infrastructure, targeting, copy, and iteration handled for you, with reporting you can actually read.',
    faq: [
      { q: 'What do I actually get?', a: 'A done-for-you outbound engine: email infrastructure, targeting and enriched data, personalized multi-channel copy, and managed campaigns across cold email and LinkedIn — plus reply triage, CRM sync, and reporting. An extension of your team you don’t have to micro-manage.' },
      { q: 'How fast can we launch?', a: 'Typically around three weeks. Week one is infrastructure and research, week two is copy and go-live, and from week three we’re iterating on live results.' },
      { q: 'Who is this for?', a: 'B2B companies that have already proven product-market fit, can follow up on leads quickly, and have a large enough market to sustain outbound — generally a TAM north of ~20k accounts and an average deal value worth a meeting.' },
      { q: 'Will this hurt my main domain?', a: 'No. All sending runs on dedicated secondary domains that are warmed and monitored, so your primary domain and reputation stay completely insulated.' },
    ],
  },

  {
    slug: 'revops',
    tag: '// revops',
    title: 'RevOps',
    blurb: 'GTM engineering as a service — TAM sourcing, enrichment, lead scoring, and a CRM that runs itself.',
    icon: 'flow',

    hero: {
      eyebrow: '// revops',
      title: 'RevOps — GTM Engineering as a Service',
      subhead: 'Custom Clay and HubSpot builds that give your sales and marketing team the GTM infrastructure they’re missing.',
    },
    problem:
      'Your CRM is half-trusted, your data lives in five places, and someone on the team still spends hours every week copying records and chasing enrichment by hand. Meanwhile the pre-AI playbooks everyone learned are quietly going obsolete. RevOps is the plumbing that fixes this — a single source of truth and the automation that lets your reps actually sell instead of maintaining spreadsheets.',
    included: [
      { title: 'TAM Sourcing', desc: 'Build and segment your total addressable market into clean, prioritized account lists your team can act on.' },
      { title: 'Inbound Orchestration', desc: 'Form fills and sign-ups enriched, scored, qualified, and routed in seconds — automatically, the moment they land.' },
      { title: 'CRM Enrichment', desc: 'Keep HubSpot or Salesforce clean and complete with Clay and 120+ data providers wired into your stack.' },
      { title: 'Lead Scoring', desc: 'Surface the accounts and contacts most likely to convert so sales spends its time where it pays off.' },
    ],
    process: [
      { title: 'Audit', desc: 'We map your current GTM stack, data, and workflows — and find where revenue is leaking to manual work.' },
      { title: 'Build', desc: 'We design and ship the workflows: enrichment, scoring, routing, and CRM automation, powered by Clay and your CRM.' },
      { title: 'Hand-off', desc: 'We document everything and hand you a system, not a dependency. Hand-off, not lock-in.' },
    ],
    proof:
      'The outcome is simple: every inbound and sourced contact enriched, scored, and routed automatically — so your team works the right accounts instead of the data.',
    faq: [
      { q: 'How do engagements work?', a: 'Two ways. Scoped sprint projects for a specific use case — TAM sourcing, inbound orchestration, CRM enrichment, or a HubSpot build — or GTM Engineering as a service, an ongoing subscription with dedicated engineers who adapt to your priorities week to week.' },
      { q: 'Who is RevOps best suited for?', a: 'Tech companies roughly between Seed and Series C, or service businesses with a real sales motion, that need GTM infrastructure built and lack the internal bandwidth to build it well.' },
      { q: 'What tools do you work in?', a: 'Clay as the engine, connected to HubSpot or Salesforce, plus the 120+ data providers and the rest of your inbox and outreach stack. We work in your tools — you keep everything.' },
      { q: 'Why invest in RevOps now?', a: 'Teams using AI in their revenue operations move faster than the ones still doing it by hand. The right system can replace hundreds of manual hours a month and make the difference between guessing and knowing who to work next.' },
    ],
  },

  {
    slug: 'seo-aeo',
    tag: '// seo_aeo',
    title: 'SEO + AEO',
    blurb: 'Rank on Google and get cited by AI answer engines — ChatGPT, Claude, Perplexity, and Gemini.',
    icon: 'search',

    hero: {
      eyebrow: '// seo_aeo',
      title: 'SEO + AEO',
      subhead: 'Rank on Google and get cited by AI answer engines — so you’re the default answer when buyers search, and when they ask ChatGPT, Claude, Perplexity, or Gemini.',
    },
    problem:
      'Buyer research has moved. A growing share of it now starts inside an AI tool, not a search bar — and the content most agencies ship is tuned for old Google, invisible to ChatGPT, Claude, Perplexity, and Gemini. The result is familiar: months of content, a couple of pages that rank, traffic that doesn’t convert, and zero citations where the buying decision actually starts. We optimize for both at once.',
    included: [
      { title: 'Technical SEO', desc: 'The foundation: site architecture, Core Web Vitals, crawlability, and schema — fix what quietly caps your growth.' },
      { title: 'Content at Scale', desc: 'Thoroughly researched content via a human-in-the-loop AI workflow, built on a citable framework and aimed at high-intent, buy-ready queries.' },
      { title: 'Answer Engine Optimization', desc: 'Entity and knowledge-graph work, structured data, and content engineered for AI to cite — so you show up inside the answers, not just the links.' },
      { title: 'Authority & Citations', desc: 'Digital PR, community and Reddit presence, and the trusted sources AI models pull from — plus tracking that ties rankings and LLM citations back to pipeline.' },
    ],
    process: [
      { title: 'Audit', desc: 'Map where you stand on both fronts — technical SEO, content gaps, and how AI engines currently talk about your category versus competitors.' },
      { title: 'Query & Keyword Mapping', desc: 'Identify the exact searches and AI questions your ICP uses when they’re ready to evaluate — every target tied to commercial intent.' },
      { title: 'Technical Foundation', desc: 'Fix the 20% of technical issues that move the business — crawlability, speed, and structured data — while content production runs in parallel.' },
      { title: 'Content Production', desc: 'Ship content built to rank and to be cited: optimized for search engines, LLMs, and the buyers who actually convert.' },
      { title: 'Authority & Citations', desc: 'Earn high-quality links and build presence in the forums, publications, and knowledge sources that AI models trust.' },
      { title: 'Continuous Optimization', desc: 'Monitor rankings and AI citations, refresh content, and adapt to algorithm and model changes — SEO and AEO are never “set and forget.”' },
    ],
    proof:
      'Built to capture high-intent search and AI citations that turn into pipeline — not vanity pageviews. We track rankings, LLM mentions, and the demo requests they drive.',
    faq: [
      { q: 'How is AEO different from SEO?', a: 'SEO is about ranking in traditional search — content, technical health, and authority. AEO is about being the answer AI gives: entity relationships, factual accuracy, structured data, and citation-ready content that ChatGPT, Claude, Perplexity, and Google’s AI Overviews will reference. We do both, because buyers now use both.' },
      { q: 'Which AI platforms do you optimize for?', a: 'ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews — plus emerging answer engines as they gain real buyer traffic.' },
      { q: 'How quickly will we see results?', a: 'AI visibility tends to move first — often within the first week or two. Meaningful organic traffic builds by around month three, with significant pipeline impact compounding from month six onward.' },
      { q: 'How do you measure success?', a: 'By what actually matters: organic demo requests and pipeline, plus AI citation frequency and share of voice. We track rankings, traffic, and domain authority too — but always tied back to revenue, not pageviews.' },
    ],
  },
]
