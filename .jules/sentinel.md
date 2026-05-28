## 2024-05-28 - Hardcoded Credentials & Client-Side Secret Exposure
**Vulnerability:** A critical security vulnerability was discovered where admin login credentials were hardcoded in `src/App.tsx`. An initial fix attempted to use `VITE_`-prefixed environment variables. However, any variable starting with `VITE_` is statically injected into the client bundle, meaning the password was still exposed in plain text to anyone inspecting the frontend source code.
**Learning:** Client-side applications cannot securely hold secrets like passwords or API keys, even if they are sourced from environment variables. Prefixing environment variables with `VITE_` exposes them to the browser. Authentication logic must always reside on a secure backend.
**Prevention:**
1. Never hardcode credentials in source code.
2. Never prefix sensitive environment variables with `VITE_` (or equivalent client-side exposure prefixes).
3. Always handle authentication and secrets validation on a backend server, exposing only standard API endpoints (like `/api/login`) to the frontend. Ensure these backend variables are accessed securely via `process.env`.
