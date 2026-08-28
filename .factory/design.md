# Screenreader Task Audit — visual thesis

## Direction

**Risograph tactile collage: the evidence desk.** The product should feel like a working audit assembled from annotated paper slips, registration marks, and ink stamps. This fits a tool built around first-hand observations: the tester's words remain the foreground, while decoration behaves like physical evidence labels rather than software chrome. The layout is intentionally left-aligned and slightly staggered. It must never resemble a centred SaaS hero or an automated compliance dashboard.

## Palette

Light is the primary treatment because it resembles an audit worksheet. Dark mode turns the desk into deep ink while retaining the same paper-and-stamp relationships.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| paper | `#F4EBD8` | `#171B22` | page background |
| sheet | `#FFF9EB` | `#222832` | working surfaces |
| ink | `#18243A` | `#F8EFD9` | primary text |
| muted ink | `#526071` | `#B9C2CC` | supporting text |
| cobalt | `#1559D6` | `#75A7FF` | links and focus |
| vermilion | `#B52F22` | `#FF8A77` | blockers and urgent stamps |
| moss | `#27643A` | `#76CB8E` | completed tasks |
| mustard | `#8A5B00` | `#F2C75C` | partial tasks and warnings |
| rule | `#A9A08E` | `#606A78` | borders and registration marks |

All foreground pairs meet WCAG AA for normal text. State labels use a word and a shape as well as colour.

## Type and spacing

- Display: Georgia, Cambria, `Times New Roman`, serif. Its editorial shapes make headings feel written and considered.
- Body and controls: system sans (`Inter` is intentionally not fetched), with tabular numerals for counts and timestamps.
- Scale: 16, 18, 23, 32, 48 px with 1.45–1.6 line height for prose.
- Spacing: 4 px base; primary rhythm 8, 16, 24, 40, 64, 96 px.
- Measure: prose stays below 68 characters. The app workspace may widen to 1180 px.
- Shape language: clipped paper corners, double-offset ink shadows, dotted cut lines, circular registration marks, and rectangular stamp labels. Controls retain standard silhouettes and 44 px targets.

## Layout and interaction grammar

The landing page uses an asymmetric two-column first screen: the job statement is a large paper label, and the original collage sits like evidence pinned beside it. Subsequent sections alternate full-width ruled sheets with offset notes. In the audit workspace, a numbered task rail sits beside one active observation sheet. On phones, the rail becomes a horizontal, wrapping task list above the form; nothing essential disappears.

Actions produce short, specific status messages in a polite live region. Adding a task feels like placing a new paper slip. Status changes add a single stamped mark. Focus uses a 3 px cobalt outline plus an outer paper gap.

## Motion policy

The one signature motion is **registration settle**: a newly opened sheet moves 6 px while its offset ink shadow aligns over 180 ms. No element loops. With `prefers-reduced-motion: reduce`, movement is removed and state changes use an immediate border/opacity change. Route changes move keyboard focus to the new `h1` without smooth scrolling.

## Original asset plan and provenance

- Hero/social source: a generated overhead risograph collage of tactile audit evidence—paper task slips, a keyboard focus path, headphones, and abstract sound-wave cutouts. It contains no text, people, logos, browser screenshots, or certification marks.
- Model/tool: Azure AI image generation through `/opt/fleet/lib/gen-image.sh`, factory deployment `factory-image`.
- Generation date: 2026-08-28.
- Prompt: “Overhead editorial still life rendered as a two-colour risograph tactile paper collage: cream recycled paper, deep navy ink, cobalt blue and vermilion red overprints, five numbered blank paper tabs without legible text, a simple keyboard key path, headphones, abstract speech-wave cut paper, registration marks and subtle halftone grain, generous negative space, accessible product audit evidence desk, crisp cut edges, no people, no hands, no logos, no brands, no readable text, no watermark, no UI screenshot, no gradients.”
- Review checklist: reject candidates containing readable pseudo-text, brand shapes, misleading UI, broken headphones, or low-contrast focal objects.
- License: original generated asset commissioned for this product; repository MIT license covers its use here.

The illustration is explanatory: five slips represent the five critical tasks; the focus path and sound waves represent keyboard focus and observed announcements.

## Tone

Calm, exact, and respectful. The product records lived evidence; it never awards a compliance score or claims certification. Copy uses “task”, “observation”, “blocker”, and “report” consistently.
