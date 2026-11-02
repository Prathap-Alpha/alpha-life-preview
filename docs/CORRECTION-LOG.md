# ALPHALIFE-FIX-20261102: correction log

Order: "Alpha Life / Omni: rejected design, fix now" (Manus, 2 Nov 2026). Branch `fix/alphalife-fix-20261102`. Same review URL: https://prathap-alpha.github.io/alpha-life-preview/ (no separate staging, no Omni deployment, no store release).

## Check-in points (kept here, not sent as progress messages)
| When | Point | State |
|---|---|---|
| 2 Nov 2026 | After logo + hero fixes | Official logo in, palette swapped, hero h1 at the reference y (274 at 1440/1280, 206 at 768/390/360). Evidence: `evidence/side-by-side-*.jpg` |
| 2 Nov 2026 | After full-page fixes | All sections recoloured, photos and loops replaced, menu fixed, 21 Playwright tests green. Evidence: `evidence/side-by-side-*.jpg`, `evidence/motion-desktop.webm` |

## Corrections
| # | Order line | What was done | Where |
|---|---|---|---|
| 1 | Remove both circled-A SVGs and the provisional mark | Both SVGs deleted. Test fails if `circle r=15` returns. | `index.html`, `tests` |
| 2 | Unchanged approved AlphaDirect logo, "Alpha Life" text separate, no redraw/filter/stretch | `assets/alpha-direct-logo.png` is a byte copy of the brand file (sha256 in `CREDITS.md`). Height set, width auto, no filter. Shown on a white background only (never on dark: CFO instruction 2 Nov). Test checks hash, aspect ratio, filter and background brightness. | `index.html`, `styles.css`, `tests` |
| 3 | Navy #1D3270, orange #F47C20, white, neutral black everywhere | Tokens `--navy`, `--orange`. Shader colours, hero and ticker fallbacks, ticker text, orbit ring and lines, outcome icons, differentiators, final band, promise rings, footer rings, badge all moved to navy/orange tints. Test scans for the 15 old blue/pink/lilac values. | `index.html`, `styles.css` |
| 4 | White-on-navy primary CTAs; orange only with tested contrast | Every `.btn` is navy with white text (about 12.8:1). Orange is used only on navy or near-black (announcement arrow, differentiator tags). White-on-orange is not used (2.71:1). Test enforces both. | `styles.css`, `tests` |
| 5 | Replace slogan chips and AI-first filler | Chips removed. Headline now "Life cover, planned in plain words." Meta description, ticker and intro paragraph reworded. The honest "planned brand, nothing on sale" lines stay. No customers, prices, benefits, approvals or certifications added. | `index.html` |
| 6 | Measure TurnStay at 1440, 1280, 768, 390, 360 | `tools/measure.mjs` captured both sites at all five sizes. Matched: hero h1 y and width, hero canvas height (810 / 1321 / 1089 / 1032), header container 1151px. Side-by-side images in `evidence/`. | `tools/`, `styles.css` |
| 7 | Restore section order | Order is hero, ticker, text + video + three cards, four photos, orbit + outcomes + CTA, tall differentiators, trust area, final loop, footer. | `index.html` |
| 8 | Keep two live Warp canvases and lazy videos | Both canvases untouched (colours only). Videos still `preload=none`, muted, looped, loaded on approach, paused off screen. Test checks. | `main.js`, `tests` |
| 9 | Replace synthetic illustrations with rights-cleared photography and footage | Four Botswana photographs (CC BY-SA 4.0) and two loops (CC0, public domain) with licence, author and source per file in `CREDITS.md`. No hotlinks, nothing bought. | `assets/`, `CREDITS.md` |
| 10 | Only the pinned frontend-design skill, pinned Playwright, preserved licences | Skill at commit ca45fc4 in `.claude/skills/frontend-design`. `@playwright/test` 1.56.1 exact. Warp shader vendored with its Apache-2.0 text. No installer bundles. | `.claude/`, `package.json` |
| 11 | Escape + focus return, outside click, resize reset; keyboard and touch tests | Fixed in `main.js`; three menu tests (touch, keyboard, link tap). | `main.js`, `tests` |
| 12 | Replace "Stay close" with a real destination or "Read project updates" | All six uses now "Read project updates", linking to the on-page Project updates block. No form, no fake submission. | `index.html` |
| 13 | Approved legal destinations before collecting data | No data is collected. Terms and Privacy remain "to follow". | `index.html` |
| 14 | Remove "Private preview" | Replaced with "Preview of a planned brand". | `index.html` |
| 15 | Omni/ADIL integration evidence or mark unimplemented | Marked unimplemented: this site has no Omni link. See below. | this file |
| 16 | Sample / negative / regression / missing-asset / mobile tests | `tests/alpha-life.spec.mjs`: 21 tests, including missing photo and video, reduced motion, no JavaScript, five-size overflow. Image thresholds were not loosened and the rejected design was not baselined. | `tests` |
| 17 | Reference-versus-new screenshots and 10-20 s motion recording | `evidence/side-by-side-{1440,1280,768,390,360}.jpg` (TurnStay left, ours right) and `evidence/motion-desktop.webm` (16 s). The test browser has no H.264, so the two video loops show as their posters in the recording; they play in real Chrome. | `evidence/` |

## Omni / ADIL integration: not implemented
This static page has no connection to Omni or ADIL. The order's accounting items (company-scoped APIs, idempotent events, GL/TB reconciliation, isolated tests) belong to the separate Omni build brief ALPHALIFE-20261102 and are not part of this site. Nothing here posts to, reads from or is deployed to Omni. No live postings were made.

## Known remaining gaps
- Reference page height is longer on phones (390: 11,459 px vs ours about 10,100; 360: 11,500 vs about 10,200) and at 768 (11,088 vs about 9,850). Desktop is within 100 px (9,595 vs 9,495). Section-by-section heights on phones were not matched.
- The reference uses people and safari photography; no free-licence people or Botswana cinematic footage was found, so landscape photographs and a US clouds loop stand in. Photos are reused across two tiles each (see `CREDITS.md`).
- The reference's own typeface is licensed and not used; Inter Tight is used instead.
