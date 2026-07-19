# Curate Your Images — W3

The image set for the portfolio, plus the judgment calls behind it.

## Content map → what's actually needed

| Need | Image | Real or generated |
|---|---|---|
| Identity reference (light) | `keepers/identity-kit-light.png` | **Real** — capture of the actual [identity kit](../identity-kit/) page |
| Identity reference (dark) | `keepers/identity-kit-dark.png` | **Real** — same page, dark theme |
| A2 case study proof | `keepers/a2-proof.png` | **Real** — actual terminal transcript from the [a2](../a2/) persistence test |
| A3 case study proof | `keepers/a3-proof.png` | **Real** — actual log output from the [a3](../a3/) full scrape run |
| Shipped-work overview | `keepers/repo-overview.png` | **Real** — live capture of this GitHub repo |
| Hero background texture | `keepers/texture-ledger.png` | Generated (see note below) |
| Section-divider accent | `keepers/texture-grid.png` | Generated (see note below) |
| "About me" photo | *(not included)* | **Needs a real photo** — not generated, not supplied yet |

## Real vs. generated — where each call was made

**Real, every time, for anything that's proof of work.** The a2 and a3 case
studies exist to show a working system, not an illustration of one — a
generated image can't stand in for verifiable output. Same logic for the
identity kit references and the repo overview: they *are* the work, so a
screenshot of them is the only honest option. All five are actual captures
(via headless Chrome), not mockups.

**Generated, only for connective tissue** — the quiet background texture
and section-divider accent that hold pages together but aren't evidence of
anything themselves.

**A disclosure, not a workaround:** this environment doesn't have a
prompted image generator (no Midjourney/DALL-E-style tool available), so
the two "generated" images are code-generated SVG textures built from the
identity kit's own color tokens (`#F3F6F5`, `#1F6F63`, `#B5502E`), not
AI-diffusion output. They fill the same role — quiet, consistent-style
connective tissue — and were iterated and judged the same way: three
variants were built, compared against the kit's mood, and one was cut. If
the real thing (an actual prompted generator) becomes available, swap
these two files for that output using the same palette and the same
"quiet, stays out of the way" bar.

**Not included: a real photo.** Anywhere the subject is a person, this
needs an actual photograph, supplied separately — not generated.

## Rejected

**`rejected/texture-starburst.png`** — a 12-ray starburst in the accent
color, radiating from a center dot.

Cut for two reasons: it breaks the identity kit's own rule that the accent
(`#B5502E`, "Stamp") is used **once per page, like a stamp of approval** —
here it's the dominant color across twelve strokes, not a single mark.
And the motif itself is generic decorative clip-art (a sunburst), not
something that says anything specific about a backend/data portfolio — it
would compete for attention with the real proof screenshots instead of
sitting quietly behind them. `texture-ledger` and `texture-grid` both won
out because they're quiet enough to disappear and specific to the
"manifest" concept (ruled lines, a schema grid) rather than decoration for
its own sake.

## Kept

- **`texture-ledger.png`** — thin ruled horizontal lines with small square
  ticks, three in signal green, one in stamp orange. Reads like ruled
  ledger paper. Quiet enough for a hero background.
- **`texture-grid.png`** — a faint dot-grid (graph-paper density) with one
  small cluster of three dots picked out in signal/signal/stamp. Works as
  a section-divider accent without pulling focus.
