# Alpha Life — final website audit

**3 November 2026 · Verdict: PASS for static client review.** The replacement closely matches Meanwhile’s simple visual concept and pacing, while using AlphaDirect branding, the retained savannah film and multi-currency life-insurance messaging. It is an intentional adaptation—not a pixel-identical copy or a live policy offer.

| Area | Result | Verified outcome |
|---|---|---|
| Hero and navigation | PASS | Full-bleed walking film, dark contrast layer, light display typography, lime actions and transparent-to-white header. Original logo and walking-film bytes are unchanged. |
| Vision film | PASS | Two fictional African adults; verified opening: “Mr Arun Iyer’s vision for an AI-first life insurance company is an excellent idea.” Second speaker: “Absolutely.” 8.064-second H.264/AAC film, user-started sound, captions and persistent fictional-dramatization disclosure. |
| Clear product concept | PASS | The main message is “Life insurance in the currency of your choice.” Exactly USD, EUR, GBP, ZAR and BWP; no Bitcoin, fabricated investor backing, world-first assertion, payout guarantee or copied Bermuda claims. |
| Reference layout | PASS | Immediate mint story panel, five-currency choice, lavender ruled benefit rows with quiet icons, dark three-step process, full-width ruled FAQ, simple closing action and restrained footer. |
| Mobile and resilience | PASS | Checked at 360, 390, 768 and 1440 pixels; no clipped controls or horizontal overflow. Keyboard/menu, no-JavaScript anchors/FAQ, reduced-motion/save-data and offline core reading/selection work. |
| Commercial integrity | PASS | US$100,000 remains a **proposed underwriting threshold**, qualified beside the figure, not free insurance. Preferences stay on-device; no application, premium, payment or policy-binding submission occurs. |

**Verification:** 19 distinct scenarios are covered by the baseline run and targeted rechecks. All four affected/recovery checks passed in the final run: normal story playback, genuinely blocked media, no-JavaScript navigation/FAQ and a non-settling play request. JavaScript syntax and source-whitespace checks pass. The media-error fixture was corrected to disable service-worker interception; the real failed-download path now displays a retry.

**Resolved:** hero layers and contrast, redundant copy, numbered benefit markers, FAQ width, cross-project cache deletion risk, no-JavaScript smooth-scroll interference, and reliable source-error/10-second media retry handling. Core offline assets include text, fonts, posters and captions; uncached speech video still needs a connection. Independent source/concept review and desktop/phone captures support this sign-off.

**Release target:** https://prathap-alpha.github.io/alpha-life-preview/ — replace only this static client-review website. Final public byte verification is required before the handover link is confirmed; no insurance backend or financial records are changed.
