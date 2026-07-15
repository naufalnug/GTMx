# SEO / Performance / A11y Baseline — GTMx (gtmx.run)

**Date:** 2026-07-15
**Stack:** Next.js 16.2.2 (App Router, React 19), deployed on Vercel. Data via Neon (with static seed fallback).
**Method:** This baseline is a **code audit**, not a live Lighthouse run. See "Verification note" below for why, and the re-test plan in `SEO-FINAL-REPORT.md`.

## Verification note (read this first)

The prompt template assumed a static `rankedtag.com` HTML site. The actual repo is a **Next.js app on Vercel**. Two consequences:

1. **Delivery-layer audits are host-managed.** Text compression (Brotli/gzip), HTTP/2/3, edge caching of hashed assets (`_next/static` ships `immutable` 1-year cache by default), and TTFB are all handled by Vercel's edge — there is nothing in this repo to tune for them, and they are already in a passing state on Vercel.
2. **Lab scores must be measured on the deployed preview.** A local Lighthouse run on this Windows dev box would not reflect Vercel's edge headers/compression/HTTP-3 and would report misleadingly low numbers. So the authoritative before/after PSI numbers must be captured on the Vercel **Preview** and **Production** URLs. The re-test plan is in the final report.

What *is* verifiable in-repo and was audited: metadata, canonicals, structured data, semantic markup, heading order, image attributes, font strategy, robots/sitemap, `llms.txt`, and security headers. Those are the levers this codebase actually controls, and they are where all the work lands.

## Pages in scope

| Template | Route | File |
|---|---|---|
| Homepage | `/` | `app/page.jsx` |
| Service page | `/services/[slug]` (automated-outbound, revops, search) | `app/services/[slug]/page.jsx` |
| Blog index | `/content` | `app/content/page.jsx` |
| Blog post | `/content/[slug]` | `app/content/[slug]/page.jsx` |
| Case study | `/case-studies/[slug]` | `app/case-studies/[slug]/page.jsx` |
| Legal | `/privacy`, `/terms` | `app/privacy/page.jsx`, `app/terms/page.jsx` |

## Already correct (no action needed)

- `<html lang="en">` set in root layout.
- `metadataBase` + per-page self-referencing canonical + matching `og:url` via `lib/seo.js` `pageMetadata()`. Query/hash stripped from canonicals. Trailing-slash policy centralized.
- Unique `<title>` + meta description on every route.
- Fonts self-hosted and subset automatically via `next/font/google`, `display: swap`, CSS-variable wiring. (Satisfies "self-host, woff2, swap" without manual work.)
- Homepage JSON-LD: `Organization`, `Service`, `FAQPage`.
- Blog post JSON-LD: `BlogPosting` + `BreadcrumbList` (+ `FAQPage` when the post has FAQs). `</script>`-safe serialization.
- `robots.js` and `sitemap.js` exist and are wired to real data; sitemap revalidates.
- Hero LCP is inline SVG (no raster LCP image to preload); decorative SVG correctly `aria-hidden`.
- Images generally carry `alt` and `loading="lazy"`.

## Gaps found (weight-ordered, all fixable with ZERO visible change)

| # | Category | Gap | Fix | Visual risk |
|---|---|---|---|---|
| 1 | Best Practices / Security | No security headers (`next.config.js` empty; no CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS). | Add via `next.config.js` `headers()`. CSP shipped **Report-Only** first (zero breakage). | None |
| 2 | Agentic Browsing | No `llms.txt` at domain root. Blocks the 3/3 target. | Add `app/llms.txt/route.js` generating a spec-valid file from real page data. | None |
| 3 | SEO / A11y | `/content` blog index has **no `<h1>`** — page starts at `<h2>`. Heading-order + "page lacks h1" failure. | Swap top tag to `<h1>` keeping the `.h2` class; promote card titles `h3`→`h2` (same class). | None |
| 4 | SEO (Rich Results) | Service pages have **no** `Service`/`BreadcrumbList` JSON-LD. | Add per-page `Service` + `BreadcrumbList`. | None |
| 5 | SEO (Rich Results) | Case-study pages have **no** structured data. | Add `Article` + `BreadcrumbList`. | None |
| 6 | SEO (Rich Results) | Homepage has `Organization` but no `WebSite` schema; `Organization` lacks `logo`. | Add `WebSite`; add `logo` to `Organization`. | None |
| 7 | SEO / crawl | `robots.js` doesn't disallow `/dashboard` (private tokenized client dashboards). AI crawlers only implicitly allowed. | Disallow `/dashboard`; add explicit allow rules for GPTBot/ClaudeBot/PerplexityBot/Google-Extended. | None |
| 8 | Performance (CLS) | Fixed partner logos (`Partners.jsx`) render via `<img>` without intrinsic `width`/`height`. | Add real intrinsic dimensions; CSS still controls display size. | None |

## Items that would require a visible change → logged for human approval

Recorded in `SEO-APPROVAL-NEEDED.md`. Colour-contrast and tap-target findings (if any surface once PSI is run against the preview) go there, not into code.
