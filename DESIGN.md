# Design

> Visual system reverse-engineered from the shipped site (`app/` + `components/`), the source of truth. The site currently runs **two** systems; this brief documents both and names **Daydream** as the canonical direction to converge on.

## Overview

GTMx's flagship aesthetic is **"Daydream"** — a warm, hand-built, neo-brutalist system: a peach paper canvas, bold 2px ink outlines, hard offset drop-shadows (no blur), a candy-pastel accent set, a gold "highlighter" marker under key words, and occasional hand-drawn (Caveat) scribbles. It reads as a confident builder's sketchbook — engineered substance, human delivery. It is the opposite of the cool-dark "engineering tool" cliché and of the timid SaaS-cream template.

A second, **Editorial** system (the older "Mercury × Browser Company" blend) still powers inner content pages — case-study detail, the blog/content reader, the dashboard demo, privacy/terms. It is quieter: true off-white, Geist + Instrument Serif italics, terracotta accent, hairline 1px rules. **It is legacy.** The strategic direction is to migrate these surfaces onto Daydream so the brand reads as one voice.

## Theme

- **Mode:** Light only. Warm, paper-like, daylit — a workbench, not a control room.
- **Strategy:** Committed. A saturated peach canvas + bold ink structure + a deliberate pastel palette carry the identity; this is not "tinted-neutral + one accent."
- **Feel:** Playful precision. Brutalist scaffolding (thick borders, solid shadows) softened by candy color and handwriting.

## Color

### Daydream (canonical — `app/home.css` `.dd`, `app/services/[slug]/page.css` `.svc-page`)

| Role | Token | Value |
|---|---|---|
| Canvas | `--peach` | `#F4ECD9` |
| Canvas deep | `--peach-deep` | `#ECDFC0` |
| Surface | `--white` | `#FFFDF9` |
| Ink (text + all borders) | `--ink` | `#1A1712` |
| Ink soft (secondary text) | `--ink-soft` | `#5C564C` |
| Service 1 / flame (Outbound) | `--svc-1` / `--flame` | `#E8552B` |
| Service 2 / blue (RevOps) | `--svc-2` | `#3E74E3` |
| Service 3 / green (Search) | `--svc-3` | `#34A56B` |
| Flame deep | `--flame-2` | `#C23F1A` |
| Mint | `--mint` / `--mint-2` | `#B6DEC4` / `#8FCBA6` |
| Sky | `--sky` / `--sky-2` | `#C2CBF2` / `#9AA8EC` |
| Lilac | `--lilac` / `--lilac-2` | `#D8B6E2` / `#C49AD2` |
| Pink / coral | `--pink` / `--pink-2` | `#F6B7A2` / `#EF9C82` |
| Gold (highlighter marker) | `--gold` | `#F4CE6A` |
| Periwinkle band (Proof bg) | — | `#E4E8FA` |

Gradients: `--grad-mintsky`, `--grad-lilacpink`, `--grad-skylilac` (135° pastel pairs, used on blobs/tiles only — never on text).

**Usage:** Peach is the canvas; white cards sit on top. Ink does double duty as both type color and every border. The three service accents are a fixed identity order — **flame → blue → green** (Outbound → RevOps → Search) — and recur in nav dots, tabs, card tiles, and per-service FAQ accents. Pastels rotate to give sections color rhythm (proof band = periwinkle, etc.). Gold is reserved for the marker underline highlight.

### Editorial (legacy — `app/globals.css`)

Canvas `--bg #FAF8F3`, paper `#FFFFFF`, sunk `#F2EFE7`; ink ramp `#14130F → #3A3833 → #6E6B63 → #A8A49A`; same terracotta `--accent #E8552B`; hairline borders `rgba(20,19,15,0.09)`.

### Contrast notes (no formal bar, but watch)
- `--ink-soft #5C564C` on `--peach`/white is fine for body; keep it off small low-weight labels on saturated fills.
- Cream text on flame panels (`rgba(255,253,247,.82)`) is large/heavy only — don't drop it to body size.

## Typography

- **Display & UI — Figtree** (`--ff`), weights 400–800. Headlines use 700 with tight tracking; this is the workhorse face for Daydream.
- **Handwriting — Caveat** (`--script`), 600/700. Scribbles, badge glyphs, the founder arrow. Personality accent only — never body.
- **Legacy — Geist Sans / Geist Mono / Instrument Serif (italic).** Powers the Editorial pages; Instrument Serif italic is the editorial emphasis face. *Candidates to retire as Daydream takes over (5 loaded families is too many).*

Scale (Daydream): h1 `clamp(52px, 8.4vw, 116px)` / 0.98 / `-0.035em`; h2 `clamp(34px, 5.2vw, 62px)`; body & lede `clamp(17–22px)` weight 500, `--ink-soft`; ledes capped 52–60ch. Headline emphasis = gold marker underline (`.hl::after`) rather than color or italics.

## Components

- **Cards** — `--white`, 2px ink border, radius 28px, hard offset shadow in a pastel (`8px 8px 0`), deepening + lifting on hover (`translate(-3px,-3px)`, shadow → saturated). Per-variant color: `--flame` / `--peri` / `--sage`.
- **Buttons** — pill or 14–16px-radius blocks, 2px ink border, `4px 4px 0` offset shadow; `.btn-dark` (ink fill), `.btn-lg--grad` (pastel gradient), `.btn-cream`. Hover lifts `translateY(-2px)`; arrow nudges.
- **Eyebrow / kicker pills** — white pill, ink border, often with 3 service-color dots or a flame dot. (Note: also a plainer mono-uppercase-tracked eyebrow variant exists — see audit; consolidate.)
- **Highlighter underline** `.hl` — gold marker swipe behind a word, slight rotation.
- **Stat blocks** — big weight-800 numbers (`clamp` to ~52px), small soft labels (proof band, founder, results).
- **Tabbed Method / FAQ** — pill tabs with service-color dots; dashed through-line connecting numbered step tiles.
- **Artifact mini-mockups** (`.af*`) — tiny faux UI windows (title bar + dotted rows) illustrating each method step. The clearest expression of "show the work."
- **Tiles** — 66px rounded-square icon holders, 2px border, pastel fill, often shadowed.

## Layout

- Max width ~1180–1240px; section padding `clamp(72–128px) 40px`; mobile gutters drop to 16–20px.
- Centered section heads (`.sec-head`, max 880px) with marker-highlighted headings.
- Grids: services & results 3-up → 1-up under 920px; method 4-up → stacked; founder 0.82fr / 1.18fr → stacked.
- Generous whitespace; color-banded sections (peach ↔ periwinkle ↔ white-with-ink-rules) drive rhythm.

## Motion

- Easing `cubic-bezier(.22,.61,.36,1)` (ease-out) throughout. No bounce, no elastic.
- Vocabulary: hover **lift** (`translateY`/`translate`) + **shadow deepen**; arrow nudges; FAQ open via `max-height`; tab show/hide.
- GSAP + react-intersection-observer are available; scroll reveals exist in the Editorial layer (`.reveal`).
- **Gaps to close:** reduced-motion alternatives aren't defined; some transitions animate layout properties (`max-height`, `width`) — see audit.

## Iconography & Illustration

Line icons drawn as inline SVG (stroke = ink or service accent), set inside rounded tiles. Decorative soft blobs (blurred, low-opacity) float behind heroes/CTAs. Hand-drawn scribbles and a marker underline supply the human texture. No stock photography; founder photo is intentionally a "stealth" placeholder card.
