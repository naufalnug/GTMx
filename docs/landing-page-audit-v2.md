# GTMx Landing Page — Claude Code Brief v2
**Site:** https://gtmx.run  
**Audit date:** April 2026  
**Current conversion score:** 71/100 (up from 54 in v1)  
**Target:** 85+/100  
**Primary new focus:** APAC localisation + remaining trust gaps

---

## What's Already Working — Do Not Break

These changes from v1 are correct. Claude Code should preserve them exactly:

- SSR rendering — page is fully indexable, keep this
- Title tag: `GTM Pipeline Engineering for B2B Teams | GTMx` — keep as-is
- Hero headline structure: outcome + timeframe + headcount objection handled
- Dual CTA: primary (Book Audit) + secondary (See Results) — keep both
- Proof bar: 4 stats above the fold — keep, update numbers per instructions below
- Transparent pricing with two tiers ($2,499 workflow / $5,000 month) — keep
- Before/After case study format — keep structure, update content per below
- Tech stack section — keep
- FAQ section — keep, update one answer per below

---

## Priority Changes — Ordered by Impact

### 1. ADD FOUNDER / TEAM SECTION
**Impact:** Critical | **Effort:** Low  
**Where:** Insert between the Case Studies section and the Pricing section  
**Why:** The page is completely anonymous. At $5K/month, buyers are hiring a person. No name or photo on a B2B services page is the #1 remaining trust gap.

**Section structure:**
```
// about

## THE PERSON BEHIND THE PIPELINE

[Founder headshot — professional, not stiff. Square crop, ideally with a slight smile.]

[Founder Name]
GTM Engineer · [City, Country — e.g. Singapore / Sydney]

[2–3 sentence bio — fill in with real details]
Default placeholder text:
"I've spent [X] years building outbound engines for B2B startups across APAC 
and globally. Before GTMx, I [previous role / company]. I started GTMx because 
most GTM agencies deliver slide decks — I build systems that actually run."

→ [LinkedIn]    → [X/Twitter]    → [Email]

Clients worked with across:
🇸🇬 Singapore  🇦🇺 Australia  🇮🇩 Indonesia  🇲🇾 Malaysia  🇯🇵 Japan  🇺🇸 USA
```

**Code note:** Use the same monospace/terminal aesthetic for the section label (`// about`). The bio and photo should break from the terminal style into clean, human formatting — this contrast is intentional and makes the founder block feel more personal.

---

### 2. APAC LOCALISATION — FULL IMPLEMENTATION

This is a multi-point change across 6 locations on the page. Make all changes together for coherent APAC positioning.

---

#### 2a. Hero subhead — add APAC signal
**Current:**
```
For Series A/B B2B teams with a sales org of 5–50 reps and a pipeline problem.
```

**Updated:**
```
For Series A/B B2B teams across APAC and globally — with a sales org of 5–50 reps 
and a pipeline problem.
```

---

#### 2b. Add APAC callout block — below the proof bar, above "How It Works"
**New section (small, inline — not a full section):**

```html
<div class="apac-callout">
  // apac_native

  Built for APAC markets — not retrofitted for them.

  We've engineered GTM pipelines across Singapore, Australia, SEA, and beyond. 
  We understand relationship-first sales cultures, multi-market territory mapping, 
  local data sourcing, and outreach that actually converts in markets where 
  US playbooks fall flat.

  Timezones covered: SGT · AEST · NZST · JST · WIB
</div>
```

**Styling:** Same terminal-card style as the pricing/services code blocks. Keep it compact — max 5 lines of copy.

---

#### 2c. Case studies — add location and more specific attribution
The three existing case studies need location context and named attribution. Update as follows:

**Case Study 1 (B2B SaaS — Pipeline Gen):**
- Add location badge: `Singapore · Series A SaaS · 12-person team`
- Update quote attribution: `-- [First Name], CEO · Series A SaaS · Singapore`

**Case Study 2 (Local Business — Territory Mapping):**
- Add location badge: `Australia · Marketplace · Expansion into 5 metros`
- Update quote attribution: `-- [First Name], VP Growth · Marketplace · Sydney`

**Case Study 3 (Fintech — GTM Workflows):**
- Add location badge: `Southeast Asia · Fintech · 8-person sales team`  
- Update quote attribution: `-- [First Name], Head of Sales · Fintech · Jakarta`

**Note to Claude Code:** Replace `[First Name]` with real first names from actual clients if available. If not, use initials (e.g. `J.T., CEO`) — anything more specific than an anonymous title.

---

#### 2d. Pricing section — add APAC currency note
**Add below both pricing cards:**

```
* Pricing in USD. APAC clients: invoicing available in AUD and SGD — 
  mention your preferred currency on the audit call.
```

**Also add** to the "Done For You" card specifically:
```
Available for APAC-based clients. Calls available SGT / AEST.
```

---

#### 2e. Primary CTA — add timezone reassurance
**Every instance of the primary CTA button** (`>>> Book a Free GTM Audit`) should have a micro-line beneath it:

```
No pitch. 30 mins. Available across SGT, AEST, and APAC timezones.
```

This applies to:
- The hero CTA
- The final CTA section at the bottom of the page
- Any floating/sticky CTA if implemented

---

#### 2f. Final CTA section — APAC-aware closing copy
**Current closing copy:**
```
Stop guessing. Start engineering.
Book a 30-minute strategy call.
```

**Updated:**
```
Stop guessing. Start engineering.
Book a 30-minute strategy call — we work with teams across APAC and globally.
Slots available in SGT, AEST, and most APAC timezones.
```

---

### 3. CASE STUDY ATTRIBUTION — FIRST NAMES + INITIALS
**Impact:** High | **Effort:** Low  
**Why:** Anonymous quotes (`-- CEO, Series A SaaS`) read as fabricated. First names or initials dramatically increase trust.

**Rule:** Every testimonial quote must have at minimum: First name or initials + Title + Market/Location.

Format: `-- James T., CEO · Series A SaaS · Singapore`

---

### 4. HERO HEADLINE — SWITCH FROM ALL-CAPS TO TITLE CASE
**Impact:** High | **Effort:** Minimal  
**Why:** All-caps hero headlines are a 2019–2021 design trend. They reduce readability and feel template-generated rather than considered. The message is strong — the casing undermines it.

**Current:**
```
PREDICTABLE PIPELINE IN 90 DAYS. NO EXTRA HEADCOUNT REQUIRED.
```

**Updated:**
```
Predictable Pipeline in 90 Days. No Extra Headcount Required.
```

No other changes to the headline — the copy itself is strong.

---

### 5. CTA MICRO-COPY — FRICTION REDUCTION
**Impact:** High | **Effort:** Low  
**Why:** "Book a Free GTM Audit" is good but gives no information about what happens next. Adding one line below the CTA handles the unspoken objection: "Will I be pitched?"

**Add below every primary CTA:**
```
No pitch. You'll leave with a clear picture of your pipeline gaps — whether you work with us or not.
```

**Shortened version for tight layouts:**
```
No pitch. Just clarity on what's working and what's not.
```

---

### 6. PROOF BAR — REPLACE VAGUE PRODUCTIVITY STAT
**Impact:** Medium | **Effort:** Low  
**Current stat:** `3–5x · Avg. Productivity Gain`  
**Problem:** Productivity is an input metric, not a revenue outcome. The wide range (3–5x) signals imprecision.

**Replace with** (choose whichever you have real data for):

Option A — if you have pipeline data:
```
$2M+ · Pipeline Generated for Clients
```

Option B — if you have meeting data across all clients:
```
500+ · Qualified Meetings Booked
```

Option C — if productivity is genuinely the best metric you have, tighten it:
```
4x · Avg. Rep Output Increase
```

Keep the other three stats (50+ Pipelines Built, 10,000+ Leads Enriched, 90 Days to First Results) — those are strong.

---

### 7. FAQ — FIX THE PRICING CONTRADICTION
**Impact:** Medium | **Effort:** Minimal  
**Why:** The FAQ asks "What does pricing look like?" and answers with "book a call and we'll scope a custom plan" — but the page already shows explicit pricing. This contradiction reads as evasive.

**Current FAQ answer:**
```
We offer project-based and retainer engagements. Book a strategy call and 
we'll scope a custom plan based on your ICP, channels, and volume targets.
```

**Updated FAQ answer:**
```
Our Done With You workflows start at $2,499/workflow — delivered turnkey, 
you run it. Our Done For You fully-managed retainer is $5,000/month with 
a dedicated GTM engineer. Both include Slack support and full documentation. 
Book a call if you'd like to scope a custom engagement.
```

---

### 8. SOCIAL PROOF — ADD LINKEDIN / CONTENT SIGNAL TO NAV OR FOOTER
**Impact:** Medium | **Effort:** Low  

The footer currently has `[LI]`, `[X]`, `[EMAIL]` links. These are placeholder-style. Make them real and visible:

- Replace `[LI]` with the actual LinkedIn URL for the founder/company page
- If there is a newsletter or content presence (LinkedIn posts, YouTube, podcast), add a brief callout in the footer: `"We publish weekly GTM breakdowns on LinkedIn → [link]"` — this signals activity and longevity, which matters for a newer brand.

---

## Complete APAC Copy Block — Ready to Paste

The following is the full APAC callout block, ready for implementation. Insert between the proof bar and the "How It Works" section:

```html
<section class="apac-callout" id="apac">
  <div class="terminal-label">// apac_native</div>
  
  <h3>Built for APAC markets — not retrofitted for them.</h3>
  
  <p>
    Most GTM playbooks are written for the US market and bolted onto APAC as an 
    afterthought. We build outbound engines that account for what actually matters 
    in this region: relationship-first sales cultures in SEA and Japan, multi-market 
    territory complexity across SGT/AEST/WIB, local data sourcing, and sequences 
    that convert in markets where a cold email template from a US agency will land flat.
  </p>

  <div class="apac-markets">
    <span>🇸🇬 Singapore</span>
    <span>🇦🇺 Australia</span>
    <span>🇮🇩 Indonesia</span>
    <span>🇲🇾 Malaysia</span>
    <span>🇯🇵 Japan</span>
    <span>🇳🇿 New Zealand</span>
    <span>+ more</span>
  </div>

  <p class="tz-line">
    Calls available across: <strong>SGT (UTC+8) · AEST (UTC+10) · JST (UTC+9) · 
    WIB (UTC+7) · NZST (UTC+12)</strong>
  </p>
</section>
```

---

## APAC-Specific SEO Additions

Add to `<head>` alongside existing meta tags:

```html
<!-- APAC geo targeting -->
<meta name="geo.region" content="SG" />
<meta name="geo.placename" content="Singapore" />

<!-- Updated description with APAC signal -->
<meta name="description" content="GTMx builds automated GTM pipeline infrastructure 
for B2B teams across APAC and globally. From enrichment and sequences to routing 
and dashboards — predictable pipeline in 90 days. Book a free audit." />

<!-- APAC-relevant keywords in page copy (not meta keywords — use in H2s and body) -->
<!-- Target: "GTM agency Singapore", "outbound pipeline APAC", 
     "B2B sales automation Australia", "GTM engineer Southeast Asia" -->
```

---

## Revised Section Order (Full Page)

```
1.  NAV — unchanged
2.  HERO — headline to title case, subhead updated with APAC
3.  PROOF BAR — update 3–5x stat per instructions above
4.  APAC CALLOUT BLOCK — NEW, insert here
5.  HOW IT WORKS — unchanged
6.  SERVICES / WHAT WE DELIVER — unchanged
7.  CASE STUDIES — update with location + first names
8.  FOUNDER / ABOUT SECTION — NEW, insert here
9.  PRICING — add APAC currency note + timezone line
10. TECH STACK — unchanged
11. FAQ — update pricing answer
12. FINAL CTA — add APAC timezone line
13. FOOTER — make social links real, add content signal
```

---

## Copy Tone Reminders

The terminal/developer aesthetic is a brand differentiator — keep it. However, apply this rule:

- **Terminal style:** section labels, service cards, the hero, tech stack — lean in
- **Human style:** founder section, testimonial quotes, APAC callout — break from terminal into clean prose

This contrast makes the founder and social proof sections feel more personal, which is exactly what's needed for a $5K/month services engagement.

---

## What Not to Change

- The `// section_name` label format — it's distinctive, keep it
- The dual CTA structure — it's working
- The before/after case study format — strong, just needs attribution
- The 3-step How It Works structure — clear and credible
- Pricing transparency — keep both tiers visible

---

*Brief v2 — generated from live audit of gtmx.run · April 2026*  
*Score at audit: 71/100 · Target after implementing this brief: 85+/100*
