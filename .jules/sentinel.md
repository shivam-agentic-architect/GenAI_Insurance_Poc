## 2025-02-28 - [Fix API Key Leakage]
**Vulnerability:** API Keys (`GEMINI_API_KEY`) were exposed to the frontend bundle via `vite.config.ts`.
**Learning:** Hardcoded or injected secrets into frontend assets can lead to key compromise.
**Prevention:** Proxy API calls that require secrets through a backend server. Ensure backend endpoints handle secret keys securely and only return the necessary results to the frontend.
