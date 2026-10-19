# J Apps Publisher — No ChatGPT Needed

**Open controller:** https://github.com/jebinc324/J-Digital-Hub/actions/workflows/j-apps-publisher.yml

This is a GitHub Actions **Run workflow** form. It works from your computer or phone after you sign in to GitHub. It does not require ChatGPT, a local Python installation or a GitHub token on your computer.

## A. Update an existing app (example: Expense Tracker v3.2.16)

1. Build and test your release APK locally. Android updates must use the **same app/package ID, the same signing key and a higher versionCode**; publishing an APK does not verify any of these.
2. Upload the APK to [our official GitHub Release](https://github.com/jebinc324/J-Digital-Hub/releases/tag/just24-public-v1) using **Edit release → Attach binaries → Update release**. Never upload a signing key, keystore, password, or private source file.
3. Open **[J Apps Publisher](https://github.com/jebinc324/J-Digital-Hub/actions/workflows/j-apps-publisher.yml)** → click **Run workflow**.
4. Select branch **main**. Fill in:
   - **mode:** `update`
   - **app_id:** `j-expense-tracker-my-expense-tracker`
   - **apk_filename:** `j-expense-tracker-my-expense-tracker-v3.2.16.apk` (use your **real** file name, not this example)
   - **version:** `v3.2.16` (enter the actual version; optional if unchanged)
   - Leave **name, description, category, logo_path, screenshots** blank to keep their existing values. **family** is ignored for updates.
5. Press **Run workflow**. Wait for a green check on the workflow run. The workflow looks up that **exact** asset on GitHub Release, verifies its download URL, size and SHA-256, and updates `public/apps/catalog.json` in the `main` branch.
6. Wait for your Render auto-deploy if configured, then verify [J Apps](https://just24things.onrender.com/apps/) and the app's **View Details → Download file** link. If stale, hard refresh. A successful commit does not itself prove Render has deployed.

**Important:** `releaseAsset` and `downloadUrl` must resolve to the same filename. The Publisher fills both automatically. It also fills `verifiedUpload.file`, `sizeBytes`, `sha256`, and `approxSizeMB` from GitHub.

## B. Add a new app

1. Upload the new APK (Android) or ZIP (Revit tools / Dynamo) to the **same GitHub Release** first.
2. Open the J Apps Publisher form and select **mode: `add`**.
3. Fill in a **unique app_id** such as `j-my-new-app` (lowercase letters, numbers, hyphens), its **exact release APK/ZIP filename**, **version**, **name**, **description**, **family**, and an optional **category**.
4. Select category from: `Engineering`, `Automation`, `Finance & Trading`, `Productivity & Files`, `Media & Creative`, `Kids & Games`, `Device & Safety`, `Lifestyle`. For new apps, blank category defaults to Productivity & Files for Android or Engineering otherwise.
5. Click **Run workflow**, verify the green check, then verify the new listing on the J Apps website.

The Publisher automatically adds the new entry, links the verified release file and updates the **project counts on the homepage and J Apps page**, including the three family filter counts. Existing app entries are kept.

### Optional official logo / screenshots

Only submit paths for images **already added to the repository**, otherwise the workflow stops safely. You can add them later by running an **update** for the same app with the existing APK filename.

- Example icon: `/assets/apps/icons/j-my-new-app.webp`
- Example screenshot paths: `/assets/apps/screenshots/j-my-new-app/home.png,/assets/apps/screenshots/j-my-new-app/settings.png`
- Upload image files through GitHub's file-upload UI under `public/assets/apps/`, keeping their original app content. Up to 8 screenshots.
- If images are not ready, leave both fields blank; the website will show a generated monogram placeholder rather than pretending screenshots exist.

## When a workflow turns red

Open the failed run and expand **Verify APK and update J Apps catalogue** for the exact error.

- **Asset not found:** file not uploaded yet, wrong tag or filename mismatch. Upload it or correct the filename.
- **App ID not found:** select `add` only when adding a new app, or copy the existing catalogue ID precisely.
- **App already exists:** use `update` instead of `add`.
- **Invalid image:** upload icon/screenshot to GitHub first, then paste its exact website path.
- **Permission denied / failed push:** in GitHub repository Settings → Actions → General, verify the workflow has permission to write repository contents, and check branch protection. An administrator may need to enable write permissions.
- **Digest missing:** GitHub did not supply SHA-256 metadata. No catalogue update is committed; recheck the asset and retry.
- **Workflow button missing:** make sure the default branch is `main`, GitHub Actions is enabled for the repo and you have write access.

## Security and publishing notes

- GitHub's built-in `GITHUB_TOKEN` is used by the workflow. **Do not paste a personal access token into this form**.
- An asset's existence and SHA-256 are *download-integrity checks*, **not app installation, signing, quality, or malware verification**.
- Only APKs/ZIPs whose exact filenames exist in the official Release can be published.
- The workflow edits `public/apps/catalog.json`; adding a new app also refreshes homepage and J Apps HTML counts. Other apps are preserved.
- Don't publish private signing data, app passwords, sensitive user data or proprietary code bundles.
- If you want to edit only descriptions or screenshots of an existing app, use `update` with its **current** release asset filename; the Publisher requires a real release file for every run.

**Repository:** https://github.com/jebinc324/J-Digital-Hub

**Direct controller:** https://github.com/jebinc324/J-Digital-Hub/actions/workflows/j-apps-publisher.yml
