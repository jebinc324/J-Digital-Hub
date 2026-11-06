# J Apps backend (future)

The frontend deploys now as a standalone static site. This folder intentionally contains no server code yet. The backend will be implemented as a separate Render Web Service after authentication, data model, offline-first compatibility and persistent storage requirements are agreed. Avoid putting signing keys, API secrets or private APKs into the public repository.

This is a design-only scaffold. `backend/server.js` does not exist; there is intentionally no runnable `npm start` command or deployed API. Before implementing a backend, add a lockfile, authenticated routes, RLS and rate-limit tests, environment validation and deployment documentation. The static J Apps free-launch website does not use this directory.
