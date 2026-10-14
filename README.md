# Just 24 Things by J&J — J Apps Free Launch (October 2026)

Website: https://just24things.onrender.com/apps/
Repository: `jebinc324/J-Digital-Hub` (public static site, Render publish directory `public`).

## Launch status
- 42 catalogue listings: 25 Android, 9 Revit Add-ins, 8 Revit Dynamo.
- All 42 listings are free/open to browse; **no login or registration required**.
- **32** public release files are already linked from GitHub Releases.
- **10** more Android apps are listed as `FREE · COMING SOON`. Their download buttons are disabled until a verified APK is uploaded. The existing supplied ZIPs do not by themselves establish a safe public release.
- GitHub Release: https://github.com/jebinc324/J-Digital-Hub/releases/tag/just24-public-v1
- Original Just24Things homepage, cream/olive brand, 24 topics, J Apps cyan neon design, and **Just 24 Things by J&J** branding preserved.

## Free launch release safety
Do not publish sensitive data such as keystores, signing keys, passwords, tokens, user information or proprietary source packages accidentally.
Before publishing each additional APK:
1. Identify correct application, version, package name and signed build.
2. Inspect ZIP contents; select distributable APK only, not debug-only or source archives with confidential files.
3. Check install/launch and key workflows on an actual device when possible.
4. Upload the verified APK to the public release.
5. Add its exact GitHub Release filename to `public/apps/catalog.json` as `releaseAsset`, and add the verified public download URL/size.
6. Remove `launchStatus: awaiting-release-review` after verification.

## Future phases
- Optional accounts, admin access or paid/professional editions can be designed later. The static site currently has no active login or payments.
- Backend draft code under `backend/` is **not deployed**, and it must not be configured/published while free-launch-only operation is intended.
- Individual project logos, screenshots, descriptions and detail pages are a later project phase, after initial downloads are complete.

## Deploy
The current site deploys automatically from the connected `main` branch to Render. Deploy completion must be verified separately in Render; a successful GitHub commit is not the same as a confirmed live deployment.

This website is a public free-launch catalogue, not a security-scanned app store.
