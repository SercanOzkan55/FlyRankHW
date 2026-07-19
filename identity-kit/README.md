# Identity Kit

One-page visual identity: type, palette, logo mark, and a style note —
built for the W3 "identity kit" brief.

Open [`index.html`](index.html) in a browser (fonts are embedded as
base64 `@font-face` data URIs, so it works standalone, no internet
required).

## Type

- **Fraunces**, weight 600 — display, used only for the name.
- **IBM Plex Sans**, 400 / 600 — body text.
- **IBM Plex Mono**, 500 — data, hex codes, and field labels.

All three are free (Google Fonts).

## Palette

| Name    | Hex       | Role                                              |
|---------|-----------|----------------------------------------------------|
| Paper   | `#F3F6F5` | Background — cool, quiet, never stark white.        |
| Ink     | `#12181B` | Text — a charcoal with a blue undertone.            |
| Signal  | `#1F6F63` | Repeats everywhere: links, labels, the mark.        |
| Stamp   | `#B5502E` | The one accent, used once per page.                 |

Dark-theme equivalents are defined alongside the light palette in the
page's CSS custom properties (`prefers-color-scheme` + a manual toggle).

## Logo / favicon

A simple "SÖ" monogram set in Fraunces — shown at favicon (16px), app-icon,
and wordmark-lockup scale in the page itself.

## Style note

> Fraunces 600 (display) + IBM Plex Sans (body) + IBM Plex Mono (data), on
> #F3F6F5 paper with #12181B ink, #1F6F63 signal, #B5502E stamp accent used
> once. Reads like a well-kept manifest: precise, unhurried, built to be
> trusted before it's built to impress.

This note is meant to be pasted into the Claude Project's custom
instructions so future case studies inherit the same look.
