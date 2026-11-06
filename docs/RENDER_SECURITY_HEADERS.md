# Render static-site security header rollout

The website is currently hosted from public/ on Render as an existing static site. Source files do not automatically manage headers on that pre-existing Dashboard-managed service.

**Policy source:** config/render-security-headers.yml is the reviewed candidate set of Render header rules. Configure those entries on the EXISTING service in Render Dashboard → Static Site → Settings → Headers; alternatively copy the headers section into the Render Blueprint that actually owns your service and sync it. Do not create another static service accidentally.

1. Before change: run curl -I https://just24things.online/ and curl -I https://just24things.online/games/retro-arcade/ to record existing response headers.
2. Apply X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, X-Frame-Options SAMEORIGIN, Permissions-Policy as listed. SAMEORIGIN is intentional because the J Arcade parent page embeds game iframes from this same site.
3. Enable HSTS with one-year max-age only after confirming HTTPS is stable for the canonical domain. Do not enable includeSubDomains or preload without separate DNS/subdomain review.
4. Start CSP in **Report-Only** mode. Check console violations in desktop, mobile and embedded modes, and test original site navigation, Google Fonts, all 14 browser games, YouTube links and Github downloads. The embedded Retro Arcade startup script was extracted to embed-mode.js so it can be covered by a strict script-src directive.
5. After all external origins are inventoried and no necessary functionality is blocked, consider changing CSP Report-Only to enforced Content-Security-Policy. The report-only rule alone does not prevent script execution.
6. Re-check response headers from the live canonical domain and any onrender.com alias. Confirm policy is actually attached to the deployed service.

Important: this source-controlled policy **does not prove current production headers**. This change requires the Render service owner's Dashboard or Blueprint action. Avoid cache immutable for unversioned assets.
