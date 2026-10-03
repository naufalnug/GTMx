# GTMx claims register

Every numeric, credential, partnership or comparative claim rendered on a public route.
**Nothing in this register has been applied.** Phase 5.1 stops here for approval.

Status key: **supported** = evidence on file · **unsupported** = no evidence supplied ·
**conflicting** = the site states two values.

| ID | Claim (current wording) | Route / file:line | Asserts | Evidence supplied | Status | Proposed wording | As of | Definition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | `1M+` / `emails sent` | `/` `Proof.jsx:16`, `Founder.jsx:41` | at least 1,000,000 cold emails sent | none | **APPLIED 2026-10-03** | tiles keep `1M+`; value centralised in `lib/site-facts.js` `founderStats` | October 2026 | STILL NEEDS INPUT: what counts as "sent" |
| R2 | `multiple millions of emails` | `/` `Founder.jsx:25` | 2,000,000+ | none | **APPLIED 2026-10-03** | now "more than 1 million emails ... (as of October 2026)". One value sitewide; "multiple millions" no longer appears anywhere. | October 2026 | as above |
| R3 | `5000+` / `MQLs generated` | `/` `Proof.jsx:17`, `Founder.jsx:43` | 5,000+ marketing qualified leads | none | **unsupported** | keep figure, add as-of date and an MQL definition | NEEDS INPUT | NEEDS INPUT: what counts as an MQL |
| R4 | `over 5,000 MQLs` | `/` `Founder.jsx:25` | same as R3 | none | **unsupported** | align format with R3 (`5,000+`) | NEEDS INPUT | as above |
| R5 | `$4M+` / `pipeline attributed` | `/` `Proof.jsx:15` | $4m+ pipeline attributable to GTMx | none | **unsupported** | keep, add as-of date and a definition | NEEDS INPUT | NEEDS INPUT: what "attributed" includes. The four named case studies total roughly $453K, so the figure must rest on unnamed work. |
| R6 | `100%` / `referral close rate` | `/` `Proof.jsx:18` | every referral received has closed | none | **unsupported, absolute** | Options: (a) add the basis visibly, e.g. "100% referral close rate (n of n referrals, 2024 to 2026)"; (b) soften to "every referral we have taken on has closed"; (c) remove. **A 100% claim in UK advertising is expected to be substantiable.** | NEEDS INPUT | NEEDS INPUT: how many referrals, what period |
| R7 | `YC` / `& public-co operators` | `/` `Founder.jsx:42` | GTMx worked with / for YC and public-company operators | none | **unsupported** | Cannot be made specific without names and roles I may publish. Options: (a) replace with the approved specific description; (b) remove the stat tile. | n/a | NEEDS INPUT: which YC companies, which public companies, which roles, which names are publishable |
| R8 | `Official partners of:` above six logos | `/` `Partners.jsx:24` | formal partner status with all six | **owner confirmed 2026-10-03: all six** | **supported** | keep as written | 2026-10-03 | partner programme membership |
| R9 | `3` / `agencies before us` | `/` `Results.jsx:65` | Vidify used 3 agencies before GTMx | the case study states it in the client's own account (`caseStudies.js:106`,`:124`,`:126`) | **supported** (client statement) | keep | n/a | client-reported |
| R10 | `backed by Serena Williams` | `/`, `/case-studies/opensponsorship` | investor fact about a client | none | **unsupported** | third-party fact about a client, not a GTMx claim. Verify or remove. | n/a | n/a |
| R11 | `first meetings usually land within 30 days` | `/` `Method.jsx:81` | typical time to first meeting | none | **conflicting** with `around three weeks` (`services.js:37`) and `3-4 weeks from launch` (`articles.js:144`) | one figure sitewide | NEEDS INPUT | NEEDS INPUT: measured from signature or from launch |
| R12 | `200+ data providers` x3 | `/services/revops`, blog | Clay marketplace size | **clay.com, read 2026-10-03** | **supported** | keep; already cited in the blog post | 2026-10-03 | Clay's own figure |
| R13 | `$200-300K fully loaded` / `3-6 months to ramp` / `$250K` | blog posts | cost and ramp of a VP of Sales | none | **unsupported and conflicting** (C12, C13) | blocked on the entity-task D1 table | n/a | n/a |
| R14 | `under $1,000 a month in the engagements GTMx runs` | blog post | GTMx tooling cost | **owner confirmed 2026-10-03** | **supported** | already attributed to GTMx experience | 2026-10-03 | GTMx engagements |
| R15 | Client result figures (OpenSponsorship, Strategy Achievers, Vidify, United Safety) | `/`, `/case-studies/*` | campaign outcomes | campaign data on each page | **supported, except Vidify** | keep. **Vidify stays untouched** until the entity-task conflict is resolved. | n/a | per case study |
| R16 | `$1M+ ARR` / `TAM ~20k accounts` / `Seed to Series C` | `/`, `/services/*`, `/llms.txt` | who GTMx sells to | none | **conflicting**: three different bars on three pages | pick one bar and state it consistently | n/a | NEEDS INPUT |
| R17 | Mockup widget figures: `12.4k`, `2,847`, `3 meetings booked`, `Duplicates: 1,204`, `38%`, `8.1k`, `318`, `41` | `/` `Method.jsx:30,36,39,46,67,73` | **nothing: these are illustrative demo graphics** | n/a by design | **unsupported as stated** | They are **live readable text in the DOM** with no `aria-hidden`, so crawlers and language models read them as GTMx statistics. **PARTIALLY APPLIED 2026-10-03**: `aria-hidden="true"` on all 12 `.mstep__art` wrappers, zero visual change (Playwright 18/18). **This fixes screen readers only.** `aria-hidden` removes content from the accessibility tree but NOT from the DOM, and Google still indexes aria-hidden text, so the figures remain readable by crawlers and answer engines. A full fix needs a visible "Illustrative" marker or removing the numbers. See the open item below. | n/a | illustrative |

## Absolute and superlative wording (needs a basis or softer wording)

`100%` referral close rate (R6) · `What we guarantee is the system` (`faq.js:101`) ·
`We never send from your primary domain` (`faq.js:42`) · `you're never locked in` (`faq.js:72`) ·
`never "set and forget."` (`services.js:95`) · `always tied back to revenue` (`services.js:102`) ·
`Previous three agencies delivered zero results` (`caseStudies.js:124`)

Most of these are process commitments rather than performance claims and read as reasonable. **R6 is
the one that states a measurable performance outcome as an absolute.**

## D6 sub-decisions, awaiting approval

1. **"GTMx in numbers" table on `/about`** (claim, value, as-of, definition) for verified claims only.
   Real HTML tables are easy for AI engines to lift. Today only R8, R12, R14 and R9 would qualify.
2. **"Facts" section in `/llms.txt`** with the same verified claims.
3. **Number style, one pattern sitewide**: `1M+` and `5,000+` in stat tiles, "more than 1 million" in
   prose, same value in both.

## Not applied

Nothing in this file has been edited into the site. Phase 5.2 and 5.3 run only after approval.

## Open after the first pass

| # | Item | Needed from the owner |
| --- | --- | --- |
| R6 | `100% referral close rate` | You chose "add the basis visibly". I need **how many referrals and over what period**, e.g. "8 of 8 referrals, 2024 to 2026". Not applied yet. |
| R7 | `YC & public-co operators` | You chose "I'll supply the specifics". I need **which YC companies, which public companies, the relationship, and which names may be published**. Not applied yet. |
| R17 | Mockup figures still crawler-readable | `aria-hidden` fixed assistive tech only. To stop answer engines reading `12.4k` / `2,847` / `Duplicates: 1,204` as GTMx data, the options are a visible "Illustrative" marker (the existing `.mstep__artcap` caption could carry it) or removing the numbers from the mockups. Needs your call. |
| R5, R3 | `$4M+ pipeline attributed`, `5000+ MQLs` | Definitions and as-of dates. Figures unchanged meanwhile. |
| R11, R16 | Time-to-first-meeting (3 values) and the qualification bar (3 values) | Which value is correct in each case. |
| R13 | `$200-300K`, `3-6 months`, `$250K` | Blocked on the entity-task D1 table (conflicts C12, C13). |
