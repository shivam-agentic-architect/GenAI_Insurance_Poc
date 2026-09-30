## 2025-02-26 - [Critical] Exposed GEMINI_API_KEY in frontend
**Vulnerability:** The GEMINI_API_KEY was exposed to the client-side via vite.config.ts `define` properties and used directly in the frontend `src/lib/gemini.ts`.
**Learning:** Keys defined in `vite.config.ts`'s `define` are statically injected into the client bundle, exposing them to anyone inspecting the frontend.
**Prevention:** Always move SDK calls that require sensitive API keys to a backend proxy or serverless function. Never inject secret keys into the frontend environment.
