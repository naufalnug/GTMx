# SEO — Visual Changes Awaiting Human Approval

Per the hard constraints, anything that would change a rendered pixel (colour
contrast, tap-target size, font size) is **not applied** — it is logged here for
a human to approve or reject. Everything shipped so far is non-visual.

## Colour contrast (Accessibility) — NEEDS A DESIGN DECISION

Measured with Lighthouse on the deployed build. **Accessibility already scores
95–96 (≥90 target met)** because these failures are on accent/label text, but
they are genuine WCAG AA contrast failures. Fixing them means darkening brand
colours on the affected surfaces — a visible change — so they are **not** made
here.

| Element (selector) | Where | FG on BG | Ratio | Needs |
|---|---|---|---|---|
| `.proof__num` | Proof stats (big numbers) | `#e8552b` on cream | 2.98 | ≥3:1 (large text) — a touch darker orange |
| `.faq-eyebrow` | FAQ section eyebrow | `#e8552b` on cream | 3.09 | ≥4.5:1 (small text) |
| `.final-eyebrow` | Final CTA eyebrow | `#fffdf7` on vermilion | 2.95 | ≥4.5:1 |
| `.rcard__vert` | Results card vertical label | `#5c564c` on card | 4.22 | ≥4.5:1 (small) — marginal |
| `.af-chip` (several) | Decorative "artifact" mockups in Method (`.af`/`.mstep__art`) | mint `#5bbf7e`, gold `#ebb73e`, greens on light | 1.8–4.1 | ≥4.5:1 (or treat as decorative) |

**Recommendation:**
- The `.af-chip` items live inside the hand-drawn artifact mockups (decorative
  illustrations of a UI). If they are decorative, the accessible fix is to mark
  the mockup container `aria-hidden` / `role="img"` with a label rather than
  recolour it — **that** would be non-visual and I can do it on approval.
- For `.proof__num`, `.faq-eyebrow`, `.final-eyebrow`: darken the token a few
  points **only on these surfaces** (e.g. vermilion `#e8552b` → ~`#cf4517` for
  small text on cream). Minimal, but it is a visible change to brand accents, so
  it needs sign-off. Estimated impact: Accessibility 96 → ~100.

Tell me which you want and I will apply it in a single reviewable commit.

## Tap targets

No tap-target failures surfaced in the Lighthouse runs on any template. Nothing
to approve here.

## SEO `link-text` (informational, target already met)

The three service-card links read "Learn more". This Lighthouse version's
`link-text` audit grades **visible** text, so the `aria-label`s I added help
screen readers but don't clear the audit. Clearing it would mean changing the
visible copy (e.g. "Learn more about RevOps"), which is a content change and is
**not** made. SEO already scores 92 (home) / 100 (other templates), so the
target is met; this is logged only for transparency. Approve a visible-copy
change if you want the audit itself green.

## Not a visual change, but needs a decision

- **Enforcing the CSP.** Still shipped as `Content-Security-Policy-Report-Only`
  (now warning-free). Enforcing needs a nonce via `middleware.js` for Next's
  inline bootstrap + the Cal.com loader. Details in `SEO-FINAL-REPORT.md`.
