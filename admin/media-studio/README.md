# Private J Apps Media Studio (desktop/localhost)

This version is **not published on the Just 24 Things public website**.

The original visitor-facing J Apps page, Arcade, and 43 downloadable apps are not modified by the editor.

## Windows (no ChatGPT needed)

1. Sign into GitHub and open the [J-Digital-Hub repository](https://github.com/jebinc324/J-Digital-Hub).
2. Use **Code → Download ZIP**, then extract the ZIP to a folder on your computer.
3. Open the extracted folder: \`admin\` → \`media-studio\`.
4. Double-click **START_MEDIA_STUDIO.bat**.
5. Python 3 must be installed. If Windows says Python is missing, install it from https://www.python.org/downloads/ (enable **Add Python to PATH** during installation), then double-click the batch file again.
6. Your browser opens a **local address** such as \`http://127.0.0.1:54321/\`. Its port varies each time, which is normal.
7. Paste a short-lived GitHub **fine-grained token** restricted to **\`jebinc324/J-Digital-Hub\`** with **Contents: Read and write**. Never share the token.
8. Choose an existing app or Upcoming / New App; browse for the app's actual logo and/or up to 8 screenshots, then click **Upload & Attach Images**.
9. A success message means GitHub has the images. Existing apps' catalogue references update immediately in the GitHub commit. New apps pick up uploaded media by matching their ID the next time you use **J Apps Publisher → add**.
10. Close the terminal window to stop the local tool. Token is not written to disk by Media Studio.

## macOS / Linux

Download/extract the same repository ZIP. Open Terminal in \`admin/media-studio/\` and run \`python3 serve.py\` (or \`sh start-media-studio.sh\`). Python 3 is required.

## Why the public page was removed

The Render site is static and cannot enforce a proper login for one page by itself. A JavaScript password prompt would not stop a visitor from downloading the page's source. We therefore **removed the publicly served \`public/apps/publisher/\` controller files** and run the controller only on your own computer at \`127.0.0.1\`. The GitHub token independently authorizes all changes to the repo.

The repo itself is public, so its **editor source code is visible on GitHub**, but it contains **no token, password, signing key or login secret**. Running it is local only. GitHub write permission is still required for uploads.

If you eventually need a login-protected dashboard accessible from any computer without installing Python, the publisher would need **a separate authenticated server / access gateway**, not only the existing Render static site.

## Security

- The local Python server binds to **127.0.0.1** using a fresh port. It is never hosted by Render.
- Browser GitHub requests go through that same local server. The server permits only the catalogue and Git endpoints needed for image uploads; it requires the local page origin, token and a special request header.
- The token is held temporarily by the browser form and forwarded to GitHub per request; it is **not saved** by the application.
- The browser page has restrictive Content Security Policy; avoid installing suspicious browser extensions with access to password fields.
- Use a short-lived **repository-restricted** GitHub token and revoke it when no longer needed. The token grants **write** access to your repository, so treat it like a password.
- Upload only official app logos and real screenshots. Media files are published in the public website to let visitors see them; **only the admin interface is private**, not the published images.
- **No Render service changes, new hosting costs, or third-party apps required.** A local computer with Python 3 and GitHub access is required.

## Other J Apps controls

APK release/update/removal stays in [J Apps Publisher](https://github.com/jebinc324/J-Digital-Hub/actions/workflows/j-apps-publisher.yml) after GitHub sign-in.

Changes on GitHub may take some time to deploy to Render.
