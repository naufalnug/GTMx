# SEO / Performance / A11y — Final Report (GTMx, gtmx.run)

**Date:** 2026-07-15
**Stack:** Next.js 16.2.2 (App Router, React 19, Turbopack) on Vercel; Neon Postgres with static-seed fallback.
**Scope:** Under-the-hood technical SEO, performance, accessibility, best-practices, and agentic-browsing readiness. **Zero visible change.**

---

## Verification (read this first — it changes how to read the score table)

The prompt template targeted a static `rankedtag.com` HTML site. The real repo
is a **Next.js app on Vercel**, which has two hard implications:

1. **The delivery layer is host-managed, not in the repo.** Brotli/gzip text
   compression, HTTP/2 + HTTP/3, `immutable` long-cache on hashed
   `/_next/static` assets, and edge TTFB are all provided by Vercel. There is no
   code here to change for them; they are already in a passing state on Vercel.

2. **Lab scores must be measured on the deployed build, not this box.** A local
   Lighthouse run on this Windows dev machine would not reproduce Vercel's edge
   (compression, cache headers, HTTP/3), and would report misleadingly low
   numbers. Additionally, the app needs `DATABASE_URL` to render the CMS-backed
   pages the way production does. So the authoritative before/after PSI numbers
   **must be captured on the Vercel Preview / Production URL.**

**What was verified in this environment (and is trustworthy):**

- `next build` (Next 16, Turbopack) compiles and **prerenders every route
  cleanly** — homepage, all service pages, all case studies, all blog posts,
  blog index, legal pages, plus `/robots.txt`, `/sitemap.xml`, `/llms.txt`.
- The generated `/llms.txt` and `/robots.txt` were read from the build output
  and validated by hand.
- JSON-LD was confirmed present and typed correctly in the built HTML for the
  homepage, a service page, and a case study.
- The `/content` `<h1>` fix was confirmed in the built HTML.

### Re-test plan (run these against the Vercel Preview)

```bash
# 1. Deploy the branch to a Vercel Preview (has DATABASE_URL + edge headers).
# 2. Point PSI at the preview URL for each template, mobile AND desktop:
npm install -g lighthouse@latest
BASE="https://<your-preview>.vercel.app"
for path in "/" "/services/automated-outbound" "/content" \
            "/content/using-ai-to-build-your-first-outbound-pipeline" \
            "/case-studies/opensponsorship" "/privacy"; do
  lighthouse "$BASE$path" --form-factor=mobile --screenEmulation.mobile \
    --output=json --output=html --output-path="./seo-reports/final/mobile$(echo $path | tr '/' '_')"
  lighthouse "$BASE$path" --preset=desktop \
    --output=json --output=html --output-path="./seo-reports/final/desktop$(echo $path | tr '/' '_')"
done
# 3. Also run the PSI "Agentic Browsing" panel on pagespeed.web.dev for "/".
```

Also validate structured data at https://search.google.com/test/rich-results
for `/`, a service page, a case study, and a blog post (expect zero errors).

---

## Score posture (code-audit basis — replace with measured PSI after preview run)

These are **expected** category outcomes based on what the code now controls;
they are not measured lab scores. Fill the "Measured" columns after the
re-test run above.

| Category | Codebase posture after this work | Expected | Measured (fill in) |
|---|---|---|---|
| Performance | next/font self-host+swap, SVG (non-raster) LCP, lazy images, CLS sources removed, Vercel Brotli/HTTP3/immutable cache | 90+ likely | |
| Accessibility | `lang`, alt text, discernible names, single-h1 per page + ordered headings, decorative SVG `aria-hidden`, no clickable divs | 90+ likely (pending contrast/tap check) | |
| Best Practices | HTTPS (Vercel), correct doctype/charset (Next), security headers added, no known deprecated APIs; console-error check pending preview | 90+ likely | |
| SEO | unique title/description + canonical per page, robots+sitemap, crawlable `<a>` links, full structured-data coverage | 90+ likely (often 100) | |
| Agentic Browsing | clean a11y tree + CLS-controlled + valid `/llms.txt` | 3/3 targeted | |

> Honest caveat: I have not seen a live PSI number for this site. "Likely 90+"
> reflects that the codebase now satisfies the audits those scores are built
> from; it is a prediction to confirm, not a measured result.

---

## Changes made, by phase (each maps to the audit it addresses)

### Phase 0 — Baseline & scaffolding — commit `Phase 0`
- Added `seo-reports/` structure and `seo-reports/baseline/BASELINE.md` (code audit + gap list). No source change.

### Phase 1 — Performance / CLS — commit `Phase 1`
- **`components/home/Partners.jsx`**: added intrinsic `width`/`height` (real PNG dimensions) + `decoding="async"` to the six partner logos.
  - **Audit:** *Cumulative Layout Shift*, *Image elements do not have explicit width and height*.
  - **Non-visual:** `.partners__logo` still pins `height:26px; width:auto`, so display size is unchanged; the attributes only let the browser reserve the box pre-load.

### Phase 2 — Accessibility & SEO (heading order) — commit `Phase 2`
- **`app/content/page.jsx`**: blog index page title `h2 → h1`; card titles `h3 → h2`. Classes (`.h2`, `.blog-card__title`) unchanged.
  - **Audit:** *Document does not have a main `<h1>`* / *Heading elements are not in sequentially-descending order*.
  - **Non-visual:** verified no tag-qualified CSS selectors; styling is byte-identical.

### Phase 3 — Best Practices (security headers) — commit `Phase 3`
- **`next.config.js`**: added `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security` (2y, includeSubDomains, preload), `Permissions-Policy` disabling unused features, and a **Report-Only** CSP. `poweredByHeader: false`.
  - **Audit:** *Trust & Safety* header diagnostics (CSP/HSTS/COOP), general hardening.
  - **Non-visual:** response headers only. CSP is Report-Only so it cannot break the Cal.com embed or Next hydration.

### Phase 4 — SEO (structured data + crawl) — commit `Phase 4`
- **`app/page.jsx`**: added `WebSite` JSON-LD; added `logo` to `Organization`.
- **`app/services/[slug]/page.jsx`**: added `Service` + `BreadcrumbList` JSON-LD (were absent).
- **`app/case-studies/[slug]/page.jsx`**: added `Article` + `BreadcrumbList` JSON-LD. `datePublished` deliberately omitted — no source date exists; nothing invented.
- **`app/robots.js`**: disallow `/dashboard` (private tokenized client dashboards); explicit allow rules for GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-Web, PerplexityBot, Google-Extended, CCBot.
  - **Audit:** *Structured data is valid* (Rich Results), crawl hygiene.
  - **Non-visual:** JSON-LD `<script>` blocks render nothing; robots is not a rendered page.

### Phase 5 — Agentic Browsing — commit `Phase 5`
- **`app/llms.txt/route.js`** (new): serves a spec-valid `/llms.txt` at the domain root, generated from the live services/case-studies data so every link is an absolute URL returning 200. Single H1, blockquote summary, sectioned bulleted links with descriptions.
  - **Audit:** PSI Agentic Browsing → valid `llms.txt`.
  - **Note:** no `/llms.txt` or `/llm-info` existed before; this is net-new. House style (no em/en dashes) is enforced by normalising dashes to commas in reused copy.

### Supporting fix — DB-less build crash — commit `fix: normalize seed-article fallback`
- **`lib/articles.js`**: the bundled seed articles omit `faqs`, which the article template dereferences as `.length`; the DB-less fallback returned them raw and crashed article prerender/SSR. Added `normalizeSeedArticle` (mirrors `rowToArticle`; `faqs`/`tags` default to `[]`).
  - Pre-existing latent bug (only triggers when Neon is unavailable). Required to get a clean production build for verification. No output change for well-formed data.

---

## Already-correct (no work needed, confirmed during audit)

`<html lang>`, `metadataBase`, per-page self-referencing canonical + `og:url`
(query/hash stripped), unique title/description per route, `next/font`
self-hosting + subsetting + `swap`, homepage `Organization`/`Service`/`FAQPage`
JSON-LD, blog-post `BlogPosting`/`BreadcrumbList`/`FAQPage`, `</script>`-safe
JSON-LD serialization, crawlable `<a href>` navigation, decorative hero SVG
`aria-hidden`, existing image `alt`/`loading="lazy"`.

## Awaiting human sign-off

See `SEO-APPROVAL-NEEDED.md`. Summary: **no visual change was required** by the
shipped fixes. Colour-contrast and tap-target audits can only surface on a live
render and are pre-logged as candidates to confirm on the preview; if any fail,
the minimal fix must be approved before the UI is touched.

---

## Host / CDN recommendations (outside the codebase)

Vercel already handles compression, HTTP/3, and `immutable` static caching, so
these are confirmations + the one open decision, not new work.

1. **Confirm the canonical host redirect.** `lib/seo.js` sets the canonical
   origin to `https://gtmx.run` (non-www, no trailing slash). In Vercel →
   Project → Domains, ensure `www.gtmx.run` **301-redirects** to `gtmx.run`
   (single hop, no chain) so canonical policy is enforced at the edge.

2. **Enforce the CSP after a monitoring window.** The policy currently ships as
   `Content-Security-Policy-Report-Only` in `next.config.js`. To enforce:
   - Add a `report-to`/`report-uri` endpoint and watch for real violations for
     a few days of production traffic.
   - Replace `'unsafe-inline'` in `script-src` with a per-request **nonce** via
     `middleware.js` (Next injects the nonce into its own inline scripts), and
     add the nonce to the two Cal.com inline loader scripts
     (`components/home/ServiceCta.jsx`, `components/CaseStudyCta.jsx`,
     `components/home/FinalCTA.jsx`).
   - Then rename the header key to `Content-Security-Policy`.
   - Enforced policy skeleton (origins already correct for the Cal.com embed):
     ```
     default-src 'self';
     base-uri 'self'; object-src 'none'; frame-ancestors 'self';
     form-action 'self' https://app.cal.com;
     img-src 'self' data: https:;
     font-src 'self' data:;
     style-src 'self' 'unsafe-inline';
     script-src 'self' 'nonce-<per-request>' https://app.cal.com https://cal.com;
     connect-src 'self' https://app.cal.com https://cal.com;
     frame-src 'self' https://app.cal.com https://cal.com;
     upgrade-insecure-requests;
     ```

3. **`Cache-Control` on HTML.** App-Router routes already send sensible
   `s-maxage`/`stale-while-revalidate` via their `revalidate` exports; no change
   needed. Hashed assets under `/_next/static` are `immutable` 1-year by default.

## Field-vs-lab reminder

Lighthouse lab scores and PSI **field data (CrUX)** can differ. CrUX reflects
real users over a trailing 28-day window. After deploying, **re-test on
pagespeed.web.dev ~28 days later** to see the field-data (Core Web Vitals)
picture stabilise; the CLS work in Phase 1 in particular shows up in field data,
not just the lab run.
