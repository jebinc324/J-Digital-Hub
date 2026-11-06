# J Digital Hub — Audit remediation status

Source: J_Digital_Hub_Full_Code_Audit_2026-11-06.md, reviewed against original main revision 7f2159de9cc79239a2f9beeaabd533d0cef77940.

This file tracks implemented source changes separately from external production validation. **CI passing is not a security certification, APK/device test or live Render verification.**

| Finding | Status in this PR | Key evidence / remaining action |
| --- | --- | --- |
| H-01 CI/release gate | Partially remediated | CI validates PRs and main, and both publisher flows now open draft PRs; GitHub branch protection/required status checks still must be turned on in repository settings; Render deploy gating must be confirmed. |
| M-01 unverified binaries | Partially remediated | Python publisher independently downloads, hashes and inspects APK/ZIP archive structure; on-demand release audit workflow added. Actual signing identity, installation compatibility, malware scanning and package testing still require a separate toolchain and reviewer. No release is automatically labelled installation/security verified. |
| M-02 Firebase rules | Safely disabled; future work pending | Firebase flag remains false and version-controlled rules deny all access. Multiplayer is not enabled. Authoritative UID/host/guest rules, join transactions, abuse controls and emulator testing remain mandatory before rollout. |
| M-03 global replacement | Fixed in source | Both publishing flows update scoped data-count markers rather than changing unrelated numeric literals; regression tests added. |
| M-04 corrupted Arcade save | Fixed in source | Nested progress, wallet, lives and boosters normalized; storage reads/writes guarded; corrupted backup attempted; persisted store UI values use textContent; tests cover malformed and hostile local storage. Browser-device regression remains required. |
| M-05 Render security headers | Candidate config prepared, not live verified | Source policy/config and rollout guide added; Render Dashboard/Blueprint configuration and external curl/browser verification still needed. CSP remains report-only pending compatibility tests. |
| M-06 catalogue availability discrepancy | Fixed in source | /apps/access/ status and count markers match catalogue link definition; publisher updates same counters on app add/remove; avoid conflating links with independently tested downloads. |
| L-01 input names | Fixed in source | Accessible names on rgbPicker, playerName and roomCodeInput. |
| L-02 missing descriptions/OG cards | Fixed in source | Classic pages have descriptions; non-home pages have page-specific title/description/url and a site-wide branded OG image; test added. |
| L-03 Clipboard fallback | Fixed in source | Absent or failing Clipboard API falls back to manual prompt. |
| L-04 Arcade h1 | Fixed in source | Main Arcade brand title now h1. |
| L-05 user zoom blocked | Fixed in source | user-scalable=no removed from Arcade viewport. |
| L-06 catalogue without JS | Partial fallback | Noscript links to the official release listing; full static per-item HTML cards are not yet generated. |
| L-07 duplicate images | Fixed for identified duplicate pairs | Two unused duplicate image files removed after confirming same Git blob SHA, saving about 215 KB in repository storage. Further responsive image optimization needs measured browser performance evidence. |
| L-08 stale docs/copy | Fixed in source | Canonical domain, publisher PR workflow, duplicate login phrasing and stale 42-card comment refreshed. |
| I-01 backend scaffold | Clarified | Removed misleading runnable start script and dependencies from non-deployed backend package manifest; documented future implementation requirements. |
| I-02 local Media Studio PAT | Further safeguarded | Local server still loopback-only and route restricted; data changes now open draft PRs requiring review; token now needs least-privilege Contents and Pull requests write. |
| I-03 prior security fixes | Preserved and expanded | Previous multiplayer text-escaping and cryptographic code checks retained; Arcade recovery and publisher integrity tests added. |

## Validation

GitHub Actions: **Security and site quality checks** runs tests/run_checks.sh. After the final PR revision, inspect its latest status on GitHub. Tests include all browser JavaScript syntax, Python compile, basic secret patterns, catalogue invariants and media targets, HTML/canonical/sitemap/OG integrity, release ZIP inspection unit tests, Arcade state recovery, and publisher-count regressions.

## Steps before merging

1. Review the diff and run visual/mobile/keyboard checks for homepage, catalogue, all 14 browser games and Media Studio.
2. Require CI status and review before merging using GitHub branch protection.
3. Inspect the release integrity report and manually test signed APK/ZIP builds; inspect package metadata before offering a "verified" label.
4. Keep Firebase multiplayer off until UID-based database rules and emulator abuse tests are implemented and passed.
5. Apply and verify headers in the existing Render service; do not assume this repository YAML affects a Dashboard-managed site.
6. Merge the PR only when reviewed and deploy on validated main, then check live responses/links and all game flows.
