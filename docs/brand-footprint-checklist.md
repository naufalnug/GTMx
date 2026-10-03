# GTMx brand footprint checklist

**For you to action. None of this can be done from the repo.**
I have not created any account, posted anything, submitted any form or contacted anyone, and I will not.

## Read this first: what the on-site work actually bought you

The repo changes make gtmx.run *eligible* to be understood and cited. They do not create a footprint.
Search engines and AI answer engines decide who "GTMx" is largely from what **other** sites say. Right
now the site has 0 ranking keywords and the name collides with **GTmetrix**, a far larger brand in a
nearby technical space. Nothing in a codebase fixes that.

Realistically: profile and directory work shows up in weeks; being reliably cited for "GTM engineering
agency" takes months of consistent mentions. Anyone promising faster is guessing.

What is now true on-site:
- One quotable definition in `Organization.description`, `/llms.txt` and visibly on `/about`:
  > GTMx is a GTM engineering agency that builds outbound, RevOps and search systems for B2B SaaS companies.
- `/llms.txt` carries an explicit disambiguation line separating GTMx from GTmetrix.
- `robots.txt` already allows GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-Web,
  PerplexityBot, Google-Extended and CCBot. No change was needed.
- Brand casing is "GTMx" everywhere in rendered output. Verified: 142 correct, zero `GTMX` or `Gtmx`.

## 1. Profiles and listings

Always write the first mention as **"GTMx, the GTM engineering agency"**. Never "GTMx" alone on a
third-party profile — that is the string that collides with GTmetrix.

| Listing | Action | Notes |
| --- | --- | --- |
| LinkedIn **company page** | Create or claim | **The repo has no company page URL.** Needed for `Organization.sameAs`, which currently ships empty. Highest priority item here. |
| LinkedIn founder profile | Confirm headline mentions GTMx | Already linked from the site: `linkedin.com/in/youhavefoundjoshua` |
| Clutch | Create agency profile | Category: B2B lead generation / email marketing |
| G2 (services) | Create seller profile | Services listing, not software |
| Crunchbase | Create organization | Use the legal name `GTMx LLC` |
| Clay partner directory | Verify a public directory exists, then apply | |
| Smartlead / Instantly / HeyReach / EmailBison / Trigify | Apply **only where an official partner programme and public listing actually exist** | See the warning below |

**Warning before you do the tool directories.** The homepage says **"Official partners of:"** above all
six logos (`components/home/Partners.jsx:24`). I could not verify that claim from the repo. If any of
those six is not a formal partner, that line is a trust and legal risk, and the directory application
will surface the discrepancy. Confirm each one, or soften the wording, before applying.

Send me the URLs once these exist and I will add them to `Organization.sameAs` — only after each one
returns a 200 (LinkedIn's 999 anti-bot status is treated as a pass; nothing else is).

## 2. Founder and community content

- Founder posts on LinkedIn, consistently, about the actual work. This is the single highest-leverage
  off-site signal for a small agency and it is the one nobody can do for you.
- Relevant subreddits (r/sales, r/SaaS, r/coldemail and similar). **Read and follow each community's
  self-promotion rules.** Answer questions; do not drop links.
- Any podcast, newsletter or community appearance: ask for the link to say
  "GTMx, the GTM engineering agency" rather than just "GTMx".

## 3. Monthly branded query test

Run these in Google **and** in ChatGPT, Claude, Perplexity and Gemini. Record the result, the date, and
crucially **whether GTmetrix or another brand appears instead of you**.

Queries: `GTMx` · `GTMx agency` · `gtmx.run` · `GTMx GTM engineering`

| Date | Query | Engine | gtmx.run cited? | Other brand shown instead | Notes |
| --- | --- | --- | --- | --- | --- |
|  | GTMx | Google |  |  |  |
|  | GTMx | ChatGPT |  |  |  |
|  | GTMx | Claude |  |  |  |
|  | GTMx | Perplexity |  |  |  |
|  | GTMx | Gemini |  |  |  |
|  | GTMx agency | Google |  |  |  |
|  | GTMx agency | ChatGPT |  |  |  |
|  | GTMx agency | Claude |  |  |  |
|  | GTMx agency | Perplexity |  |  |  |
|  | GTMx agency | Gemini |  |  |  |
|  | gtmx.run | Google |  |  |  |
|  | gtmx.run | ChatGPT |  |  |  |
|  | gtmx.run | Claude |  |  |  |
|  | gtmx.run | Perplexity |  |  |  |
|  | gtmx.run | Gemini |  |  |  |
|  | GTMx GTM engineering | Google |  |  |  |
|  | GTMx GTM engineering | ChatGPT |  |  |  |
|  | GTMx GTM engineering | Claude |  |  |  |
|  | GTMx GTM engineering | Perplexity |  |  |  |
|  | GTMx GTM engineering | Gemini |  |  |  |

Expect the first few months to come back mostly "no, GTmetrix shown instead". That is the baseline, not
a failure. What matters is the trend after the listings in section 1 are live.

## 4. What is still blocked in the repo, waiting on you

- **Founder surname** — `Person` schema and post bylines are built but held. First name only is all the
  repo has, and it will not be inferred.
- **LinkedIn company page URL** — `Organization.sameAs` ships empty without it.
- **The 19 unresolved factual contradictions** in `.claude/decisions-entity.md`.
- **Approved name variants** — `Organization.alternateName` is omitted because none are approved.
