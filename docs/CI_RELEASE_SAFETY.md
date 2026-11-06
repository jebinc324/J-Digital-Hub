# J Digital Hub release safeguards

## What this repository enforces

- The security-smoke.yml workflow runs website checks on all main pull requests and pushes.
- tests/run_checks.sh validates JavaScript syntax, Python syntax, catalogue invariants, local links, sitemap, Open Graph, basic secret patterns and regression tests.
- GitHub Actions J Apps Publisher prepares a draft PR rather than pushing directly to main. The private Media Studio also creates draft PRs instead of directly updating main.
- Catalogue verifiedUpload means GitHub metadata (filename, size, SHA-256) was recorded. It does not mean antivirus, device installation, APK signature consistency, or production readiness was verified.
- Firebase online multiplayer stays disabled without intentional opt-in and must not be enabled without verified database rules and abuse tests.

## Required GitHub owner action (not automated by these files)

In GitHub repository Settings → Branches, add a branch protection rule for main, or configure a ruleset:

1. Require pull requests before merging (prefer at least one review approval).
2. Require status checks before merging. Select the test job from Security and site quality checks once it has completed at least once.
3. Block force pushes and deletions, and include administrators and automation in enforcement where feasible.
4. In Settings → Actions → General, allow GitHub Actions to create pull requests if using the Publisher controller.
5. PRs created with the built-in GITHUB_TOKEN may not automatically trigger a new workflow run. Publisher runs tests/run_checks.sh before creating its PR; also run Security and site quality checks → Run workflow on the publisher branch, or trigger checks with an authorized human before merging.
6. Restrict Render auto-deploy to validated commits on main. Confirm preview checks independently before merging.

GitHub branch settings are not equivalent to merely committing a CI YAML file. Confirm the actual required checks and branch rule in the GitHub UI.

## Binary verification before claiming a tested release

For every uploaded APK, ZIP or Dynamo file, track in an independently reviewed manifest: filename, downloaded SHA-256, size, product ID, app version, APK package ID, signing certificate fingerprint, installation-tested device/version, test date, reviewer, and test outcome. Inspect archives for unexpected private keys and path traversal; verify APK signing and version continuity using an Android testing toolchain. Do not describe a file as malware-free or installation-verified based on its GitHub digest.

## Render security headers

See RENDER_SECURITY_HEADERS.md for the version-controlled policy and instructions for the actual Render Dashboard. Committing the policy alone does not activate it.
