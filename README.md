# Alpha Life — multi-currency client-review website

Client review: https://prathap-alpha.github.io/alpha-life-preview/

This static replacement follows the supplied Meanwhile concept with AlphaDirect branding, the retained savannah-walking film and an original fictional promotional vision film. The only currency choices are USD, EUR, GBP, ZAR and BWP. It does not issue policies, collect premiums or submit applications.

The consolidated concept and functional audit is in `review/2026-11-03/REVIEW.md`. Asset notices are in `CREDITS.md`. Source files are `index.html`, `styles.css`, `main.js` and `sw.js`; local fonts and media are in `fonts/` and `assets/`.

For local review, run `python3 -m http.server 8077` from this directory and open `http://localhost:8077/`. For automated checks, run `npm ci` and `BASE_URL=http://localhost:8077/ npx playwright test`. Core offline behavior requires HTTPS or localhost and a successful first online visit. Speech playback starts only after the viewer presses Play.
