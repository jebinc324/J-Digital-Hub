# Just24Things v1.3.0 — Mixed J Apps Catalogue

Built on original v1.2.0 website; the original hero banner, 24 topics, games page, channel page, responsive styling and themes remain in place.

## Ready now
- `/apps/` app directory with search, Public / Restricted filters and platform filters.
- 17 project cards, with **PROPOSED** access labels only; **owner must approve classifications before any public release**.
- `public/apps/catalog.json` is the editable registry. Add genuine GitHub Release URLs to `downloadUrl` for owner-approved **public** items only. Until then, public cards show `Download coming soon`.
- Restricted cards link to `/apps/access/`. This is an explanation page — NOT live authentication. No private APK, passwords, token or private object paths are in the public package.
- Homepage and secondary pages link to the download centre.

## Approval checklist
1. Review each `access` in `public/apps/catalog.json` and change `public` / `restricted` as you decide.
2. Upload approved public APKs to GitHub **Releases**, not ordinary public repo directories. Paste verified public release asset URLs in `downloadUrl` only after checking APK signature and package IDs.
3. Do not store restricted APKs in this repository, Render static files, a public GitHub release, or public R2 buckets.
4. For restricted access, configure backend authentication, permission checks, private R2 bucket (or equivalent), and short-lived signed GET URLs. This requires a separate running backend and private storage credentials.
5. Verify app versions, screenshots, hashes and release notes before calling any app downloadable.

## Deployment
Render Static Site: branch `main`, root directory blank, build command `echo "Static site ready"`, publish directory `public`. GitHub pushes should auto deploy.

**No APK download is enabled by default.** Switching a card to `restricted` is a label, not an access control. Never put a real restricted binary URL into `catalog.json`.
