# GTMx post template

Copy this structure for every new post. Sections marked REQUIRED are not optional.

```
H1            The searched query, written as a human would say it. One H1 only.

Answer block  REQUIRED. 40–60 words, directly under the intro, answering the H1
              question outright. This is the block an AI engine lifts. Do not
              bury the answer or tease it.

Key facts     REQUIRED. 3–5 bullets. Each one specific and checkable. No
              adjectives doing the work of evidence.

Byline        REQUIRED once the founder surname is supplied (decision D5).
              Visible, in a <p> or <span>, NEVER a heading. Links to
              /about#founder. Connects to the Person @id in schema.

Body          Descriptive H2s. H3 only where a section genuinely has sub-parts;
              never invent structure to justify a heading. No skipped levels.

Sources       REQUIRED whenever an external figure appears. Every number that
              did not come from GTMx's own campaigns needs a URL and the date
              it was read. A post with an unsourced external statistic does not
              ship.

Related       REQUIRED. One service, one case study, one sibling post. Already
              automated by the "Keep reading" block (app/content/[slug]).

FAQ           Only where the questions are real ones buyers ask. Do not pad.
```

## Heading rules (enforced by scripts/verify-headings.mjs)
One H1 per page. No skipped levels. Real spaces in heading text. No stat figures
or labels as headings. Every heading present in the server-rendered HTML.

## Voice
Short, direct, specific, no hype. US spelling ("optimize", "personalized").
Banned: unlock, supercharge, elevate, harness, leverage, revolutionize,
"the ultimate", "game-changing".

## Expert-input blocks
A brief carries an empty `EI-###` block. **An empty block means the post is
blocked.** It is never filled with something plausible. No draft begins until a
filled block comes back.
