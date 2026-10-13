# Just 24 Things by J&J — v1.4 (J Apps neon download centre)

This updates the existing Render Static Site (`just24things.onrender.com`).
Keep the existing Render service and GitHub repository `jebinc324/J-Digital-Hub`.
Set **Publish directory** to `public` and leave root directory blank.

## What changed
- "Just 24 Things by J&J" visible across homepage, games, about, J Apps, footer and titles; original YouTube cover unchanged.
- Glowing cyan J logo (supplied by the owner) on `/apps/`; responsive neon design.
- User-approved 64 selected projects: Android 26 (16 open, 10 restricted),
  Revit Add-ins 19 open, Dynamo 17 open, Windows/Trading 2 open.
- Category filters, Open/Restricted filters, search, file-provided metadata.
- Safe release link detection: downloads only appear after an actual file with the
  correct name exists in a public GitHub Release tagged `just24-public-v1`.

## PUBLIC hosting — the EASY way
1. Review / test every public release asset. Debug and tiny APKs should be
   replaced by production-signed, verified builds before public distribution.
2. Open https://github.com/jebinc324/J-Digital-Hub/releases/new
3. Tag name: `just24-public-v1`; title: `Just 24 Things by J&J — J Apps Public Releases`.
4. Drag and drop individual files from PUBLIC_RELEASE_UPLOAD (provided separately).
   Do not upload the PUBLIC pack ZIP as a single asset; the site matches individual names.
5. Publish the GitHub release. The site automatically discovers the matching
   assets through GitHub's public release API; allow a short delay and refresh.

## RESTRICTED hosting
Do NOT upload restricted files, keystores, signing data or ZIPs containing them to
GitHub Releases or `public/` — neither provides restricted downloads on a static site.
For simple controlled sharing: private Google Drive folder, Sharing "Restricted",
 grant access to named Google accounts only. For in-site sign-in and permissioned
 downloads, a real backend plus private storage are required. This package does
 not pretend to provide authentication.

## Deploy site update
Extract this ZIP, copy *contents* (`public/` and `README.md`) into the
same GitHub repository, replacing same-named files. Commit changes and allow Render
automatic deploy, then test https://just24things.onrender.com/apps/.

## Notes
- Actual APKs are NOT included inside this website ZIP.
- Private assets are NOT included in this website ZIP nor the public release pack.
- ZIP presence is not proof of safe installation. Check version/signature and
  permissions before any public downloads.
- Spreadsheet selections are the authoritative Open/Restricted labels.
