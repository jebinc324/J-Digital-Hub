# J Digital Hub — Render starter site

A responsive, standalone static website (HTML, CSS, vanilla JS). No Node/npm, paid dependencies or external assets required. Includes J Apps portfolio, Just24Things page, and an honest J Arcade roadmap. The 12 Android games and online backend are **not** included; they require existing source/projects and follow-up development.

## GitHub web upload

1. Create a repository named `J-Digital-Hub` at https://github.com/new, with README initialization **OFF** (optional).
2. **Extract** the distributed ZIP on your computer (do not upload the ZIP file as-is).
3. Open repository → **uploading an existing file** (or Add file → Upload files).
4. Drag all **contents** of `J-Digital-Hub-Starter/` into the page, preserving folder paths (`public/index.html` etc.).
5. Commit changes to `main`. Do not commit credentials or signing keys.

## Render deployment

New → Static Site → select `J-Digital-Hub` repo → Connect.

| Field | Value |
|---|---|
| Name | `j-digital-hub` (subject to availability) |
| Branch | `main` |
| Root Directory | Leave empty |
| Build Command | `echo "Static site ready"` |
| Publish Directory | `public` |

Then choose **Create Static Site** / **Deploy Static Site**. Visit the assigned HTTPS `*.onrender.com` URL when Render reports a successful deployment.

## Local preview

Open `public/index.html` in any browser or use `python -m http.server 8000 --directory public` and open http://localhost:8000.

## Important

- The site is a real deployable frontend, but browser games and backend are **not** implemented yet.
- Showcases use existing project names; release links are not included without verified download URLs.
- Static hosting has Render usage limits. Render's free web backend can spin down after inactivity.
- To port 12 games faithfully, provide the original 12-game source assets/project. APK alone often cannot reproduce full editable game logic.
