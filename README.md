# Just 24 Things by J&J — J Apps Free Launch (October 2026)

Website: https://just24things.onrender.com/apps/
Repository: `jebinc324/J-Digital-Hub` (public static site, Render publish directory `public`).

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
