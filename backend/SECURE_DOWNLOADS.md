# Architecture notes — restricted download service (NOT DEPLOYED)

Static frontend alone cannot protect binary downloads. Required backend workflow:

1. Identity provider: login via OAuth or verified email; secure server session (HttpOnly, Secure, SameSite) or verifiable signed JWT.
2. Server checks user identity, app entitlement and release version before issuing any download.
3. Restricted APK/EXE stays in **private** storage (e.g. Cloudflare R2 with public access OFF); never commit to public GitHub or `public/`.
4. Backend generates a short-lived signed GET URL with a fixed permitted object key, e.g. 60 seconds, returned only after authorization. URL is a bearer credential until expiry and may be shared while valid.
5. Rate-limit login and download requests, audit entitlement changes, secure secrets as server-only environment variables, configure allowlisted CORS origins and security headers.
6. Render Free Web Service sleeps when idle; choose a provider and DB plan appropriate for required availability and persistence.

This file documents the *future service*. It does not implement authorization.
