## 2025-03-09 - Vite config define injection of API Keys
**Vulnerability:** The API key `GEMINI_API_KEY` was being injected into the Vite frontend build through the `define` block in `vite.config.ts`, exposing the secret in the client bundle and enabling misuse.
**Learning:** Using `process.env.*` in `define` of frontend builds directly exposes these values to any user who inspects the frontend code. This is a critical security gap in SPA architectures.
**Prevention:** Avoid defining sensitive variables in `vite.config.ts`. Instead, use backend proxies (like `/api/gemini/generate`) to encapsulate the SDK logic securely on the server-side, fetching strictly via relative API paths without sharing API keys.
