/* ──────────────────────────────────────────────
   GTMx — lib/site-facts.js
   Single source of truth for facts that appear in three or more places
   across different files. Centralised so the same figure cannot drift
   between the homepage cards and the case study pages again (the Phase 0
   audit found 23 cross-page contradictions, several of them exactly this).

   Figures here are BASE values with no suffix. Each call site composes its
   own wording ("$170K+ pipeline", "40+ SQLs"), so rendered text is
   unchanged — only the number now has one home.
   ────────────────────────────────────────────── */

/** Approved one-sentence definition (decision D7, 2026-10-03).
 *  Used by Organization.description, /llms.txt and the /about page. */
export const BRAND_DEFINITION =
  'GTMx is a GTM engineering agency that builds outbound, RevOps and search systems for B2B SaaS companies.'

/** Founder and company stats shown in the homepage stat tiles and the founder bio.
 *  Centralised because the email figure appears in three places across two files,
 *  which is how "1M+" and "multiple millions" drifted apart in the first place.
 *  `prose` is the long form used in sentences; `tile` is the compact stat form. */
export const founderStats = {
  emailsSent: { tile: '1M+', prose: 'more than 1 million emails', asOf: 'October 2026' },
  mqls: { tile: '5000+', prose: 'over 5,000 MQLs' },
}

/** Canonical client names. Short forms are allowed on cards; the full form
 *  is what goes in schema and on the case study page itself. */
export const clientNames = {
  openSponsorship: { full: 'OpenSponsorship', short: 'OpenSponsorship' },
  strategyAchievers: { full: 'Strategy Achievers', short: 'Strategy Achievers' },
  vidify: { full: 'Metatron Concepts (Vidify)', short: 'Vidify' },
  unitedSafety: { full: 'United Safety Training Systems', short: 'United Safety' },
}

/** Headline client figures. Each appears in data/caseStudies.js AND in
 *  components/home/Results.jsx, i.e. across a file boundary. */
export const clientFacts = {
  openSponsorship: { pipeline: '$170K', revenue: '$10K', leads: '40+' },
  strategyAchievers: { pipeline: '$150K', revenue: '$21K', leads: '~100' },
  vidify: { pipeline: '$133K', revenue: '$10K+', opportunities: '103', bestMonth: '54' },
  unitedSafety: { leads: '60+' },
}
