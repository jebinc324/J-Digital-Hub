# Just 24 Things by J&J — J Apps Free Launch (October 2026)

Website: https://just24things.onrender.com/apps/
Repository: `jebinc324/J-Digital-Hub` (public static site, Render publish directory `public`).

## Launch status
- 42 catalogue listings: 25 Android, 9 Revit Add-ins, 8 Revit Dynamo.
- All 42 listings are free/open to browse; **no login or registration required**.
- **42** public release files are linked directly from GitHub Releases.
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
