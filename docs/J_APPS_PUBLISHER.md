# J Apps Publisher — No ChatGPT Needed

**Open controller:** https://github.com/jebinc324/J-Digital-Hub/actions/workflows/j-apps-publisher.yml

This is a GitHub Actions **Run workflow** form. It works from your computer or phone after you sign in to GitHub. It does not require ChatGPT, a local Python installation or a GitHub token on your computer.

## Private image attachments — choose files, no links to copy

The Image Upload Studio is **no longer available at /apps/publisher/** on the public Render website. It has moved to a **localhost-only editor**, because static pages cannot enforce an owner-only login.

**[Open Private Media Studio setup guide](../admin/media-studio/README.md)**

1. Download the J-Digital-Hub repo ZIP from GitHub and extract it.
2. On Windows, double-click `admin/media-studio/START_MEDIA_STUDIO.bat`. On Mac/Linux, run `python3 admin/media-studio/serve.py`. Python 3 is required.
3. Your browser opens a private `http://127.0.0.1:<port>/` page, accessible only from your computer.
4. Paste a short-lived GitHub fine-grained token restricted to `jebinc324/J-Digital-Hub` with **Contents: Read and write**.
5. Choose an app, select logo and screenshots directly from your computer, and press **Upload & Attach Images**.

Existing app logos and screenshots are automatically published and linked to the catalogue when the GitHub commit succeeds. New app images are picked up automatically when you use J Apps Publisher `add` with the **same ID**. No manual image paths required.

**Security:** The token is used in local browser memory and forwarded to GitHub through the local Python server. No token is committed or stored by the tool. Close the window when finished. The images themselves will be public on the J Apps website; the editor is private. The public website cannot host this admin controller without adding an authenticated backend.

## A. Update an existing app (example: Expense Tracker v3.2.16)

1. Build and test your release APK locally. Android updates must use the **same app/package ID, the same signing key and a higher versionCode**; publishing an APK does not verify any of these.
2. Upload the APK to [our official GitHub Release](https://github.com/jebinc324/J-Digital-Hub/releases/tag/just24-public-v1) using **Edit release → Attach binaries → Update release**. Never upload a signing key, keystore, password, or private source file.
3. Open **[J Apps Publisher](https://github.com/jebinc324/J-Digital-Hub/actions/workflows/j-apps-publisher.yml)** → click **Run workflow**.
4. Select branch **main**. Fill in:
   - **mode:** `update`
   - **app_id:** `j-expense-tracker-my-expense-tracker`
   - **apk_filename:** `j-expense-tracker-my-expense-tracker-v3.2.16.apk` (use your **real** file name, not this example)
   - **version:** `v3.2.16` (enter the actual version; optional if unchanged)
   - Leave **name, description, category, logo_path, screenshots** blank to keep their existing values. After using Media Studio, leaving the two image fields blank automatically attaches your uploaded files. **family** is ignored for updates.
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

## C. Remove an app card from the website

**No ChatGPT needed.** Go to [J Apps Publisher](https://github.com/jebinc324/J-Digital-Hub/actions/workflows/j-apps-publisher.yml) → **Run workflow**, choose **main**, then:

1. **mode:** `remove`
2. **app_id:** the **exact** existing catalogue ID, e.g. `j-my-new-app`
3. **apk_filename:** type `REMOVE:j-my-new-app` to confirm. Replace `j-my-new-app` with the exact ID you entered above.
4. Leave other inputs blank/default, click **Run workflow** and wait for the green check.
5. Verify the card is gone from [J Apps](https://just24things.onrender.com/apps/) after Render deploy.

This removes only the app's **website catalogue entry**, not the actual APK/ZIP in GitHub Releases and not any uploaded logos/screenshots. The website project counts update automatically. If you want the app back later, choose `add` and enter its details again. The GitHub commit history also keeps a record of the original listing.

**Safety:** The confirmation must exactly match `REMOVE:<app_id>`. Normal filenames do not remove anything. The workflow will stop with an error if the ID does not exist, the confirmation differs, or removal would empty the catalogue. An already-published release file is *never* deleted by this action.

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
- **Removal confirmation error:** select `remove` and enter `REMOVE:<app_id>` in the required APK filename field, using the exact same ID.
- **Removal not reflected on website:** check that the workflow run is green and Render has deployed the new commit.
- **Invalid image:** upload icon/screenshot to GitHub first, then paste its exact website path.
- **Permission denied / failed push:** in GitHub repository Settings → Actions → General, verify the workflow has permission to write repository contents, and check branch protection. An administrator may need to enable write permissions.
- **Digest missing:** GitHub did not supply SHA-256 metadata. No catalogue update is committed; recheck the asset and retry.
- **Workflow button missing:** make sure the default branch is `main`, GitHub Actions is enabled for the repo and you have write access.

## Security and publishing notes

- GitHub's built-in `GITHUB_TOKEN` is used by the workflow. **Do not paste a personal access token into this form**.
- An asset's existence and SHA-256 are *download-integrity checks*, **not app installation, signing, quality, or malware verification**.
- Only APKs/ZIPs whose exact filenames exist in the official Release can be published.
- The workflow edits `public/apps/catalog.json`; adding or removing an app also refreshes homepage and J Apps HTML counts. Other apps are preserved.
- Don't publish private signing data, app passwords, sensitive user data or proprietary code bundles.
- If you want to edit only descriptions or screenshots of an existing app, use `update` with its **current** release asset filename; the Publisher requires a real release file for every run.

**Repository:** https://github.com/jebinc324/J-Digital-Hub

**Direct controller:** https://github.com/jebinc324/J-Digital-Hub/actions/workflows/j-apps-publisher.yml
