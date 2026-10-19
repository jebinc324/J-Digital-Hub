# Just 24 Things by J&J — J Apps Free Launch (October 2026)

Website: https://just24things.onrender.com/apps/
Repository: `jebinc324/J-Digital-Hub` (public static site, Render publish directory `public`).

## J Apps Publisher — manage releases without ChatGPT

**[Open J Apps Publisher (GitHub Actions controller)](https://github.com/jebinc324/J-Digital-Hub/actions/workflows/j-apps-publisher.yml)**

Upload your APK/ZIP to the [public GitHub Release](https://github.com/jebinc324/J-Digital-Hub/releases/tag/just24-public-v1), then use **Run workflow → update or add**. It checks the exact release file, size and SHA-256, sets matching download metadata in `public/apps/catalog.json`, and commits changes. Adding a new app updates the website's project counts. Sign in to GitHub; **ChatGPT and local programming are not needed**. Logo/screenshots are optional and must be committed to `public/assets/apps/` before referencing their paths.

[Complete step-by-step manual](docs/J_APPS_PUBLISHER.md) · Files: [workflow](.github/workflows/j-apps-publisher.yml) and [publisher script](.github/scripts/publish_j_app.py). GitHub Actions write access and Render auto-deploy must be enabled for hands-off publication.

## Launch status
- 43 catalogue listings: 25 Android, 10 Revit Add-ins/standalone Revit tools, 8 Revit Dynamo.
- All 43 listings are free/open to browse; **no login or registration required**.
- **43** project download files are linked directly from GitHub Releases, including J Batch NWC Exporter for Revit 2024. Existence does not verify installation or functionality.
- The 10 additional Android APKs have also been uploaded and linked. Upload confirms availability, not safety or compatibility; these builds remain marked as independently untested.
- GitHub Release: https://github.com/jebinc324/J-Digital-Hub/releases/tag/just24-public-v1
- Original Just24Things homepage, cream/olive brand, 24 topics, J Apps cyan neon design, and **Just 24 Things by J&J** branding preserved.

## Free launch release safety
Do not publish sensitive data such as keystores, signing keys, passwords, tokens, user information or proprietary source packages accidentally.
Before promoting a build as verified:
1. Identify correct application, version, package name and signed build.
2. Inspect ZIP contents; select distributable APK only, not debug-only or source archives with confidential files.
3. Check install/launch and key workflows on an actual device when possible.
4. Replace the file in the GitHub Release if newer/safer, preserving the original app signature and package ID for updates.
5. Refresh its matching GitHub download URL, size and SHA-256 in `public/apps/catalog.json`.
6. Mark it tested only after checking install/launch, device support and privacy.

## Future phases
- Optional accounts, admin access or paid/professional editions can be designed later. The static site currently has no active login or payments.
- Backend draft code under `backend/` is **not deployed**, and it must not be configured/published while free-launch-only operation is intended.
- Individual project logos, screenshots, descriptions and detail pages are a later project phase, after initial downloads are complete.

## Deploy
The current site deploys automatically from the connected `main` branch to Render. Deploy completion must be verified separately in Render; a successful GitHub commit is not the same as a confirmed live deployment.

This website is a public free-launch catalogue, not a security-scanned app store.

## J Apps premium catalogue UI (October 14 update)

- Premium, responsive cyan-neon product cards are live in `public/apps/index.html`, `catalog.js`, and `neon.css`. Original J-branded hero, global navigation, and all 43 downloads remain in place.
- Includes featured apps, category filters, search, version metadata, APK/archive download size, free download actions, and a keyboard-closable product detail dialog.
- Product details have an official screenshot gallery slot. SHA-256 hashes remain in catalogue metadata but are hidden from visitors. Deep links can use `/apps/?app=j-control-hub`.
- **No fake previews:** original per-app icons/screenshots are not yet present in this repository. The UI displays lettermark placeholders and a clearly labeled empty screenshot gallery until real media is provided.

### Add original app media later
Upload each owner-approved logo (PNG, WebP, JPG, JPEG) under `public/assets/apps/icons/` and real captures under `public/assets/apps/screenshots/APP-ID/`. In the corresponding `public/apps/catalog.json` item, set:
```json
{
  "logo": "/assets/apps/icons/j-control-hub.png",
  "screenshots": [
    "/assets/apps/screenshots/j-control-hub/01.webp",
    "/assets/apps/screenshots/j-control-hub/02.webp"
  ]
}
```
This adds image media without changing existing binary download links. Do not invent or silently substitute screenshots from other apps. Accurate version labels should be confirmed against the actual package: the catalogue may include historical development-version notes.

## Premium sitewide animation update (2026-10-14)
- Shared `/motion.css` + `/motion.js` are linked on the homepage, J Apps, J Arcade, Our Channel, and J Apps Free Launch information page.
- Premium effects: J&J logo wordmark entrance, scattered headings gathering into place, repeatable bidirectional viewport reveals (down and up), staggered app cards, gentle J Apps hero parallax, reading progress, and animated app-detail popup.
- No external GSAP/CDN dependency. Uses `IntersectionObserver`, CSS transforms, passive scroll handling, and `requestAnimationFrame`.
- Motion is off when the visitor enables reduced-motion in their operating system or when browser APIs are unsupported. Existing content, filters, navigation, themes, and download links remain functional without motion.
- **Editor's Choice** now highlights Nifty Lot Calculator, J Expense Tracker / My Expense Tracker, and J Algo Trader (research/replay concept). The Algo build has not been installation-verified.
- If polishing later, keep all app downloads and the original cover/J logo untouched. Test desktop and mobile scroll, search filtering, keyboard accessibility, and reduced-motion setting after deployment.

## Arcade and Revit Batch NWC intake (2026-10-14)
- Original Retro Arcade browser web package: `J-Retro-Arcade-Web-v0.2.1.zip` (stored in owner's Library).
- Extract the web package and upload original website-root contents (including `index.html` and relative assets) to `public/games/retro-arcade/` on branch `main`. All six original web files are now uploaded. The `/games/` page links to `/games/retro-arcade/` as the solo browser play entry; Firebase multiplayer is not configured.
- Revit catalogue contains **J Batch NWC Exporter — Revit 2024**, labelled a standalone Revit 2024 export utility, sourced from `J_Batch_NWC_Standalone_Revit2024.zip` (owner-supplied ~6.3 KB). Contents have not been inspected; do not assert it is a finished installer or verified NWC exporter.
- Release asset `j-batch-nwc-standalone-revit2024.zip` is now uploaded and linked on `just24-public-v1` (6,293 bytes). **Inspect and test the archive before treating it as a verified installer or NWC exporter**, including dependencies and confidential data risks.
- The earlier 42 J Apps downloads remain, with the 43rd NWC tool added; both site brand themes remain unchanged.

## Reversible paper-cover and scroll replay (2026-10-14)
- `/motion.js` now keeps observing elements, resetting reveal only when they exit the viewport fully. Both scroll-down and scroll-up re-entry animate again.
- The original home-cover image (`/assets/just24-cover.webp`) is untouched. A CSS clipped paper-edge rolls it up as scroll progresses and unrolls it when scrolling upward.
- The effect is reversible and turns off for visitors who prefer reduced motion; it does not resize the page or replace the original banner.
- J Retro Arcade Web v0.2.1 files are hosted under `/games/retro-arcade/`. Solo mode is the supported mode. Room-based online multiplayer requires an explicitly configured backend.

## Arcade embedded in the J&J page (October 14, 2026)
- `/games/` now shows the uploaded original J Retro Arcade Web v0.2.1 inside the page, via a responsive `iframe` that loads `/games/retro-arcade/`. The user does not need to navigate to a separate page or download a ZIP to play.
- **J Arcade** appears in the global header navigation on the Arcade page with `aria-current="page"`. Other top-level pages already have the navigation item.
- The public Arcade page no longer shows a Download ZIP button or links that navigate to the standalone game page; the "Start playing" button scrolls to the embedded game on the same page.
- `public/games/embedded.css` styles the in-page game frame. Original `app.js`, styles, local saved progress and optional unconfigured Firebase multiplayer remain untouched.
- The public GitHub release archive was not deleted; only the website's download CTA was removed. Android app downloads in the separate J Apps catalogue were not changed.
- A browser/device playthrough remains necessary to verify all 12 games work well inside the embedded viewport.

## Arcade: one-scroll embedded layout (2026-10-14)
- `/games/embed.js` observes the original same-origin J Retro Arcade screen, expanding the iframe to the full home/store content height so visitors scroll only the outer Just24Things page.
- Selecting gameplay, loading or the stage roadmap restores a normal playable viewport height, and keeps the game within view after long lists collapse.
- The embedded-only `jj-in-page-arcade` CSS class suppresses document-level nested scrollbars without changing standalone game play or the game-specific 1000-stage roadmap scroller.
- No APK or game rules, stage save data, arcade points, or downloads were modified. Check real phone/desktop browser behavior after Render deploy.

## J Arcade Hybrid Retro Premium full-page theme (2026-10-14)
- Main `/games/` now uses the scoped `jj-retro-arcade` theme: dark navy, neon cyan/magenta, pixel/console labels, J art, PRESS START and illuminated game cabinet.
- `public/games/retro-premium.css` styles only the J Arcade main page, including header/nav colors and footer, without affecting the other Just24Things pages.
- `/games/retro-arcade/?embed=1` loads the original 12-game application inside the main page and adds an embedded-only `jj-in-page-arcade` neon card/control skin from `retro-embedded.css`.
- The original game engine (`app.js`) and its local saved data, lives, stages, points, controls and resizing logic remain unchanged; the normal `/games/retro-arcade/` route retains its original appearance.
- The single outer page scroll height bridge in `/games/embed.js` is preserved. No ZIP download option, login, or separate page/window is introduced.
- CSS has responsive narrow-screen rules and reduced-motion support. Playthrough in desktop and mobile browsers is still recommended after deployment.

## Paper Roll v2: collapse the empty height (2026-10-14)
- Original homepage cover has a `jj-paper-slot` wrapper in `public/index.html`.
- `public/motion.js` controls the wrapper's real pixel height during scrolling, so the introduction and following sections move up rather than leaving an empty clipped-image space. Reverses exactly on scroll up.
- `public/motion.css` renders a thicker curved paper cylinder: 62px desktop and 42px mobile, plus a soft paper fold shadow. The original `just24-cover.webp` artwork is untouched.
- The fixed-size/clip-only version left the entire banner height in document flow. It was replaced rather than stacked with another clip.
- Reduced-motion users see the full original static cover; CSS and JS remain scoped to the homepage paper slot.
- A local headless Chromium layout fixture passed both 1200px desktop and 390px mobile scroll-down/up reflow checks. The deployed Render site still needs a manual visual check.

## Homepage themed highlights: J Apps & J Retro Arcade (2026-10-14)
- The homepage has two independently scoped showcase themes in `public/home-showcase.css`: `home-japps` matches the cyan-neon J Apps workshop and `home-retro-arcade` matches the dark navy / cyan / magenta Hybrid Retro Premium J Arcade.
- All other sections retain the original cream/olive Just24Things editorial design and the reversible paper-roll home cover remains untouched.
- The J Apps homepage section is now full-bleed, while its cards and filters retain their existing DOM/classes and filtering logic. Seven showcased projects have deep links to verified catalogue IDs; J Fun Lab is shown as a creative project only because it is not currently a downloadable catalogue entry.
- The homepage J Arcade section now accurately states the uploaded 12-game browser build is playable, and the CTA leads to the existing in-page player on `/games/`; the former coming-soon messaging was removed.
- The theme is pure CSS/HTML, keeps responsive 4/3/2/1-card layouts, reduced-motion preferences and existing site-wide entrance/scroll effects. No game logic, Download ZIP, or catalogue release assets were changed.
- Visual browser inspection should still be done after Render deploy; GitHub changes alone do not verify the current published Render page.


## Ambient wallpaper + indexing preparation (2026-10-14)
- **Keep J Apps homepage showcase:** the original eight cards, four filters and "Meet J Apps." heading remain in place after user clarified they did not want the cards removed.
- New `/ambient.js` and `/ambient.css` are connected to the five J&J main site pages (home, apps, apps/access, games, our channel). They paint a viewport-fixed, pointer-transparent, low-opacity orbital wallpaper, with center-based colors reflecting J Apps / Arcade sections.
- The effect is limited to 30fps and typically 24 desktop / 11 mobile particles, fewer on very low-resource devices; it pauses in background tabs and honors `prefers-reduced-motion`. The independent original game inside the Arcade iframe was not modified, preserving its gameplay performance.
- The site remains free and the 43 existing J Apps downloads remain intact. The paper-roll cover and in-page Arcade player are unchanged.
- Existing `robots.txt` allows all crawlers and advertises the sitemap. `sitemap.xml` now lists six public URLs including the playable Arcade path and Apps Free Launch information page.
- Missing canonical metadata on Games, Our Channel, Apps/access and Retro Arcade were added. These improvements help crawler discovery, **but do not submit anything to Google**; the site owner must verify the URL-prefix property in Google Search Console, submit `sitemap.xml`, then use URL Inspection/Request Indexing. Crawling/indexing/ranking are not guaranteed.
- These changes were verified in the GitHub repository. Live Render deployment and real-browser visual behavior need separate confirmation.
