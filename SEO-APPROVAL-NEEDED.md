# SEO — Visual Changes Awaiting Human Approval

Per the hard constraints, anything that would change a rendered pixel (colour
contrast, tap-target size, font size, spacing) is **not applied**. It is logged
here for a human to approve or reject.

## Status: no visual changes were required by the fixes shipped

Every change made in Phases 0–5 is non-visual by construction (markup
semantics, HTML attributes, response headers, JSON-LD `<script>` blocks, a new
`/llms.txt` endpoint, robots/sitemap, and one DB-less-fallback bug fix). None
touch a CSS rule, a class, visible text, colour, font, or layout. So there is
nothing in this file that blocks the current work.

## Items to re-check once Lighthouse runs against the Vercel preview

I could not run PageSpeed Insights / Lighthouse against the deployed site from
this environment (see `SEO-FINAL-REPORT.md` → "Verification"). Two audit
categories can only surface on a live render and, if they fail, would require a
visual change — so they are pre-logged here as **candidates**. Confirm against
the preview URL; if any fail, fill in the element + minimal change and get
sign-off before touching the UI.

| Candidate | Where to look | Why it may surface | Minimal fix (needs approval) | Est. score impact |
|---|---|---|---|---|
| Colour contrast | `--ink-soft` muted text on peach/tinted fills (flagged in `PRODUCT.md`); eyebrow/label text; muted `.lede`/`.sec-lede`; footer fine print | These are the classic sub-4.5:1 risks on this warm palette | Nudge the muted ink token a few points darker **only on the failing surfaces** | Accessibility: up to ~7 pts if it's the sole contrast failure |
| Tap-target size | Footer inline links (`Privacy · Terms`), nav links on mobile, FAQ `<summary>` toggles | Targets under 24×24 CSS px / too close together fail on mobile | Increase hit area via padding (no visible box change) or spacing | Accessibility: ~small; mobile-only |

If both come back clean on the preview, no visual change is needed anywhere and
this file can be closed as "nothing to approve."

## Not a visual change, but needs a human decision (tracked in the final report)

- **Enforcing the CSP.** Shipped as `Content-Security-Policy-Report-Only`.
  Flipping it to enforced needs a short monitoring window + nonce-based inline
  handling. Details and the exact policy are in `SEO-FINAL-REPORT.md`.
