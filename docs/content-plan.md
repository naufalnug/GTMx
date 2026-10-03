# GTMx content plan — first 12 weeks

Cadence: **2 posts per month for 3 months, then review** (decision D8). That is a ceiling gated by
expert input and the quality bar, not a quota. Six slots total: **four new posts, two reserved**
(~25%) for refreshes and for responding to Search Console once data exists.

Ordering is deliberate: the pillar ships first, and every supporting post links up to it.

## The quality gate

Every post must pass **both** tests or it goes on the rejected list with a reason.

1. **Information gain.** It contains at least one thing a reader cannot get from the top 5 existing
   results: original data, a named client case that has been approved, a first-hand process from a
   filled expert-input block, an original table or framework, or a synthesis of primary sources nobody
   has put together.
2. **Existence test.** Would it be worth publishing if search engines did not exist?

Applied to what is already live: **all three existing posts fail test 1.** See `.claude/blog-audit.md`.
They are not being deleted; two of the six slots are reserved to fix them.

## Demand data

**`NEEDS INPUT` on every row.** No keyword export has been supplied, so no search volume appears in
this plan. I will not invent volumes. Send the exports listed in `.claude/data-request.md` items 11–12
and I will add a demand column and re-order on evidence rather than on judgement.

## Plan

| # | Week | Working title | Target query | Intent | Information gain | Data source | Author | Internal links out | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1–2 | What Is GTM Engineering? (pillar, definition-led) | "gtm engineering" | Informational | Original definition plus a framework separating GTM engineering from RevOps and from growth. Synthesis of primary tool docs. | Expert input `EI-001` + primary sources | `NEEDS INPUT` | all 3 services, /about, /case-studies | briefed |
| 2 | 3–4 | GTM Engineering Agency vs Hiring In-House | "gtm engineering agency" | Commercial | Real cost comparison built from GTMx's own engagement shape against a loaded senior-hire cost. Needs the C12/C13 numbers settled first. | Expert input `EI-002` + D1 table | `NEEDS INPUT` | /services/revops, /about, post 1 | briefed, **blocked on D1** |
| 3 | 5–6 | What a Clay Agency Actually Does | "clay agency" | Commercial | A real Clay build walked through step by step, with the actual provider count settled (C4: 50+ vs 120+). | Expert input `EI-003` + D1 table | `NEEDS INPUT` | /services/revops, /case-studies, post 1 | briefed, **blocked on D1** |
| 4 | 7–8 | How to Choose an AEO Agency | "aeo agency" | Commercial | First-hand account of optimizing for AI answer engines, including what was measured and what did not work. Needs the C1 citation-timing conflict settled. | Expert input `EI-004` + D1 table | `NEEDS INPUT` | /services/seo-aeo, post 1 | briefed, **blocked on D1** |
| 5 | 9–10 | RESERVED — refresh | n/a | n/a | Source every statistic in the three existing posts; resolve C4/C12/C13/C14. | `.claude/blog-audit.md` | `NEEDS INPUT` | n/a | reserved |
| 6 | 11–12 | RESERVED — Search Console response | n/a | n/a | Whatever the first 8 weeks of query data actually shows. | GSC export | `NEEDS INPUT` | n/a | reserved |

### Considered and not scheduled

| Topic | Why not |
| --- | --- |
| "outbound agency pricing" | GTMx does not publish pricing anywhere on the site. A pricing post without real numbers is exactly the undifferentiated filler the gate exists to stop. Schedule it only if you want pricing public. |

## Pipeline

Every post moves through these in order. **None is skipped.** Current state is tracked in
`.claude/task-state.md`.

`idea → briefed → expert input received → drafted → fact checked → reviewed → published → indexed → measured`

All four briefed posts are at **briefed**. None can advance: each carries an empty expert-input block,
and three additionally wait on the D1 contradiction table.

## Hard rule

**Nothing is drafted until a filled expert-input block comes back.** An empty `EI-###` block blocks the
post. It will not be filled with something plausible.
