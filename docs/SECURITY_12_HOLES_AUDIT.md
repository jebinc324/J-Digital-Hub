# Just24Things: 12 security-hole review (28 October 2026)

**Scope:** source review of `jebinc324/J-Digital-Hub` on `main` before this branch. This is **not** a penetration test, complete Git-history scan, live hosting assessment, or certification. Video: the 12-item security checklist supplied by the project owner. Treat the items as *checks*, not as evidence that all 12 flaws exist.

## Deployment assumptions verified in repository

- The public website is a static site under `public/`. `backend/README.md` says the server is not implemented or deployed.
- The J Apps catalogue links to intentionally **public** GitHub Release assets. Frontend download links are not access controls.
- `backend/schema.sql` enables RLS for a future `download_members` table and contains no public table policies. Whether it was applied to a real database is **not verified**.
- The Retro Arcade Firebase multiplayer feature is **not configured** in `public/games/retro-arcade/firebase-config.js`. It could become security-sensitive if activated.

## Video's 12 checks and findings

| # | Video label | Evidence and status | Required action |
|---|---|---|---|
| 01 | Key in frontend | No live private key identified in reviewed frontend files; Firebase web config is empty. Firebase client `apiKey`, if later set, is **not** a service-role secret. **Not a verified vulnerability.** | Keep privileged keys, GitHub PATs, service-role tokens and signing keys server-side only. Never use frontend checks to protect a secret. |
| 02 | Secret in Git | Placeholder environment variables exist in `backend/.env.example`. **Git history and all release artifacts were not audited.** | Run a full-history secret scan (for example, Gitleaks) and inspect releases. Revoke/rotate *any* exposed credential before cleaning history. |
| 03 | No RLS | Future Supabase SQL enables RLS for `download_members`; **live Supabase configuration unknown**. Firebase Realtime Database rules were not supplied. | Verify deny-by-default policies in the actual project. Before enabling Firebase multiplayer, publish and test owner-scoped database rules. |
| 04 | UI-only auth | No live login/entitlement backend in this repo; public downloads are deliberately free. **Not applicable to free public catalogue.** | For future restricted releases, verify auth and entitlement on the server on **every** request. |
| 05 | IDOR | No deployed per-user order/download API identified. **Not currently testable.** | Future endpoints must derive user identity from verified sessions, not request IDs, and check ownership for each resource. |
| 06 | Mass assignment | No deployed JSON write API for user profiles or orders. Local Media Studio is a loopback-only GitHub editor with route allowlisting. **Not currently testable for a live API.** | Future API: accept an explicit field allowlist, disallow role/status/owner edits by users. |
| 07 | No rate limit | No deployed login or private download endpoint. **Not applicable to the current static site**; static hosting does not provide an API rate limit. | Add rate limits, abuse monitoring and bounded request sizes if authentication/download APIs launch. Firebase database rules and App Check require separate review. |
| 08 | Client-only check | Game progress lives in localStorage and is only suitable for *local* gameplay. Multiplayer permissions currently rely on client controls if Firebase is enabled. **Needs backend-rule verification before launch.** | Never trust localStorage, client role checks or browser scores for paid rewards or user-specific authorization. |
| 09 | SQL injection | No deployed SQL-query API; `backend/schema.sql` is schema setup only. **Not currently applicable.** | Parameterized queries and least-privilege DB roles for any future server-side SQL. |
| 10 | XSS | **Conditional code weakness found:** Retro Arcade `bindRoom()` inserted remote multiplayer player names and room status into `innerHTML`. Firebase is currently unconfigured, but this would be exploitable with untrusted room data when enabled. | **Patched in this branch:** use DOM nodes and `textContent`/`createTextNode`, never HTML interpolation for multiplayer fields. |
| 11 | Unsafe upload | There is no public user-upload endpoint. The localhost Media Studio is a separate privileged publishing tool, **not a public upload service**. Live file-processing security not independently tested. | Validate file signature/type/size at the trust boundary, randomize storage keys, and ensure uploaded HTML/SVG/script cannot execute from your origin. |
| 12 | Returns everything | Public app metadata is intentionally public. No deployed private user API to audit. **Not currently applicable.** | Use response DTOs/allowlists; never serialize password hashes, tokens, other users' records, or internal metadata. |

## Changes on this branch

1. `public/games/retro-arcade/app.js`: render remote room information as text nodes (the verified XSS sink).
2. `public/games/retro-arcade/firebase-multiplayer.js`: generate room codes using `crypto.getRandomValues` instead of `Math.random`. Codes are *not* a replacement for database authorization.
3. `public/ambient.js`: reduce mobile full-screen canvas work from ~30 to ~15 frames per second and cap mobile pixel ratio at 1.25. This is a **code-based performance optimization**, not a measured PageSpeed score improvement.

## Render Dashboard headers (manual configuration; NOT applied by this PR)

Render static-site custom headers are configured under **Static Site > Settings > Headers**, unless the service is managed from a Blueprint. Do not assume a repository file automatically changes the existing Render dashboard configuration.

Recommended initial rules:

| Path | Header | Value |
|---|---|---|
| `/*` | `X-Content-Type-Options` | `nosniff` |
| `/*` | `X-Frame-Options` | `SAMEORIGIN` |
| `/*` | `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `/*` | `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `/assets/*` | `Cache-Control` | `public, max-age=86400` |

**Use `SAMEORIGIN`, not `DENY`:** the website deliberately embeds its own same-origin Retro Arcade and classic games inside iframes. Don't use `immutable` for unversioned filenames which can change in place. Review any active Content Security Policy with a **Report-Only** trial before enforcing because this project includes inline scripts/styles and external Firebase modules.

References: [Render static-site headers](https://render.com/docs/static-site-headers), [Render Blueprint specification](https://render.com/docs/blueprint-spec).

## Before declaring “all 12 clear”

- Inspect **all branches, Git history, and release assets** for leaked secrets. If a real secret leaked, revoke and rotate it, then clean history appropriately.
- Confirm real Render response headers with a live `curl -I https://just24things.online`.
- Get an actual **mobile PageSpeed Insights/Lighthouse report** and compare LCP, TBT, CLS and score before/after merging. The shared report was not accessible in the audit environment; no current score is claimed.
- If enabling Supabase, test RLS with separate test accounts in the **live** database. Don't assume the SQL file has been run.
- If enabling Firebase multiplayer, write deny-by-default Realtime Database rules restricting host/guest actions to their authenticated UIDs, verify no other room can be read or modified, and test rejected unauthorized writes. Client-side checks **do not** enforce permissions. Add anti-abuse controls for anonymous account creation and room creation.
- If enabling private downloads, implement and deploy the backend first: server-side authentication, per-object authorization, rate-limiting, private storage, short-lived links, and response allowlists.
- Exercise multiplayer with HTML-like player names (for example `<img src=x onerror=alert(1)>`) and verify it appears as **plain text** in the room UI without script execution. Re-test the static site after merge.

**Current conclusion:** The video provided a threat checklist. One conditional DOM-XSS sink was identified and patched in this branch; other checks are either not applicable to the current static site, require external-service verification, or are future-service requirements. **12/12 cannot truthfully be declared security-tested or cleared.**
