/* ──────────────────────────────────────────────
   GTMx — data/faq.js
   Single source of truth for the FAQ section AND the FAQPage
   JSON-LD in app/page.jsx.

   - faqShared : 3 universal objections, shown above the tabs.
   - faqTabs   : service-specific objections, one tab each
                 (Automated Outbound / RevOps / Search).
   - faqs      : flat list (shared + all tabs) for structured data.
   ────────────────────────────────────────────── */

export const faqShared = [
  {
    q: 'How is this different from a typical lead gen or SDR agency?',
    a: `Lead gen agencies rent you reps who send the same template to the same scraped list. We engineer a system. Signal-based targeting in Clay, AI-personalized copy, deliverability infrastructure built on secondary domains, lead scoring and routing in your CRM, and weekly tuning on what's converting. Humans set the strategy. The system handles the throughput. When the engagement ends, you keep the system — workflows, data, infrastructure, all of it.`,
  },
  {
    q: 'Shouldn\u2019t we just hire a VP of Sales or an SDR?',
    a: `A senior sales hire costs $250K+ fully loaded and takes six months to ramp — and nearly half are replaced within two years. The reason isn't the hire. It's that there's no repeatable process for them to execute against. We build the engine first. You hire the driver into a system that's already producing pipeline. That's the order most founders get backwards.`,
  },
  {
    q: 'What\u2019s the pricing model? Do I need to commit for months?',
    a: `Engagements run on a 90-day initial commitment — long enough to build the engine, launch it, and prove pipeline. After that, month-to-month. We don't lock clients into 12-month contracts because we don't need to — the system compounds, and the work shows. Pricing depends on which systems you're building. We'll quote against scope on the strategy call.`,
  },
]

export const faqTabs = [
  {
    id: 'outbound',
    label: 'Automated Outbound',
    items: [
      {
        q: 'We tried outbound before and it didn\u2019t work. Why would this?',
        a: `Because the previous attempt probably treated outbound as a copy problem. It's an infrastructure problem first. Cold buyers need different urgency triggers than warm ones, your sending setup determines whether they ever see the message, and the lead list determines whether the message is relevant in the first place. We rebuild all three layers — infrastructure, list, and message — engineered for cold buyers specifically. That's why it works the second time.`,
      },
      {
        q: 'How quickly does pipeline go live?',
        a: `Two to three weeks to launch, first qualified meetings inside 30 days. Week 1: audit and infrastructure setup — secondary domains warmed, mailboxes provisioned, CRM mapped. Weeks 2–3: lead lists built in Clay, sequences written, LinkedIn profiles optimized. Week 3–4: campaigns go live across email and LinkedIn simultaneously. First meetings typically land within the first 30 days.`,
      },
      {
        q: 'How do you protect my domain reputation?',
        a: `We never send from your primary domain. We register secondary domains that redirect to yours, warm them up over 2–3 weeks, and rotate sending across multiple mailboxes so volume stays safe. If a domain ever burns, your main one isn't touched. This is the single biggest mistake founders make on their first outbound attempt — and the reason most "we tried outbound" stories ended badly.`,
      },
      {
        q: 'What visibility do I have? Do I see the messages and the lead lists?',
        a: `You approve everything before it ships. Lead lists, sequences, copy variants — all reviewed by you before launch. Once live, you get a shared dashboard with daily reply data, booked meetings, and pipeline value. No retainer black box. If something isn't working, you see it the same day we do.`,
      },
      {
        q: 'What stack do you use? Do I keep it after?',
        a: `Default stack: Clay for enrichment, Instantly for cold email, HeyReach for LinkedIn, HubSpot or Salesforce for CRM. Everything lives in your accounts, not ours — workflows, sequences, lead data, infrastructure. When the engagement ends, you own the system end-to-end. No dependency, no handover cost.`,
      },
    ],
  },
  {
    id: 'revops',
    label: 'RevOps',
    items: [
      {
        q: 'Why hire you instead of a full-time RevOps person?',
        a: `A senior RevOps hire takes 4–6 months to ramp and another 3 to ship the first meaningful workflow. We deliver the same system in 30–60 days because we've built this stack dozens of times. When the engagement ends, your in-house team inherits something that's already working — and the hire you make next becomes 10x more productive on day one.`,
      },
      {
        q: 'We\u2019re already using HubSpot / Salesforce. Will you work with our setup?',
        a: `Yes. We default to Clay for enrichment, but the CRM is yours. We've built engines on HubSpot, Salesforce, Attio, and Pipedrive. The architecture changes; the principles don't — clean data in, scored leads out, routed to the right person, attribution that actually works.`,
      },
      {
        q: 'What does \u201CGTM engineering as a service\u201D actually mean?',
        a: `It means we build the workflows your sales team would build themselves if they had three months and a RevOps engineer. TAM sourcing in Clay, deduplication and enrichment on every new lead, scoring rules tied to your ICP, routing to the right rep based on territory or fit, and dashboards that show what's working without manual reporting. You stop doing data hygiene and start selling.`,
      },
      {
        q: 'Who owns the workflows after the engagement ends?',
        a: `You do. Every workflow is built in your tools, on your account, under your login. We hand over documentation, loom walkthroughs, and a 30-day support window for your team to take over. If you want us to keep running it, we can — but you're never locked in by us holding the keys.`,
      },
      {
        q: 'How do you measure success on RevOps work?',
        a: `Three numbers. Time saved (hours per week your team gets back from manual work), data quality (deduplication rate, enrichment coverage, lead-to-account match rate), and pipeline velocity (how fast leads move from new to qualified). We baseline these in week 1 and report them weekly.`,
      },
    ],
  },
  {
    id: 'search',
    label: 'Search',
    items: [
      {
        q: 'What\u2019s the difference between SEO and AEO — and why do I need both?',
        a: `SEO is being found on Google. AEO (Answer Engine Optimization) is being cited by ChatGPT, Claude, Perplexity, and Gemini. Both matter because buyers split their research between the two — and the content patterns that win in each are different. We build for both because optimizing only for Google means becoming invisible to the half of your buyers using AI to research vendors.`,
      },
      {
        q: 'How long before we see results?',
        a: `First indexed pages and rank movement: 4–6 weeks. First AI citations: 2–4 weeks (faster than Google because LLMs re-train and re-index more frequently). Meaningful pipeline contribution: 3–4 months. Anyone promising faster is selling spam tactics that won't survive the next algorithm or model update.`,
      },
      {
        q: 'Are you just paying Claude to write our articles?',
        a: `No. AI handles keyword research, gap analysis, and first-pass drafts. A senior strategist sets the angle, fact-checks, and rewrites for tone. Nothing ships without human review. The unfair advantage isn't AI doing the writing — it's the combination of AI scale, human judgment, and a system that learns from what's getting cited.`,
      },
      {
        q: 'How do you measure success on AEO when there\u2019s no ranking dashboard?',
        a: `We track citation frequency across ChatGPT, Claude, Perplexity, and Gemini for the queries your buyers actually run. We also monitor branded mentions, comparison appearances ("X vs Y"), and category-defining citations ("best tools for X"). Plus the underlying business metrics — organic traffic, demo requests, pipeline contribution. AI visibility only matters if it converts.`,
      },
      {
        q: 'Do you guarantee #1 rankings?',
        a: `No, and avoid anyone who does. What we guarantee is the system — technical SEO baseline, content shipped on schedule, AI citation tracking in place, monthly performance review. The rankings are an output of that system working correctly, not a contractual promise. Anyone offering a rankings guarantee is either lying or planning to spam.`,
      },
    ],
  },
]

/* Flat list for the FAQPage structured data in app/page.jsx */
export const faqs = [
  ...faqShared,
  ...faqTabs.flatMap(tab => tab.items),
].map(({ q, a }) => ({ question: q, answer: a }))
