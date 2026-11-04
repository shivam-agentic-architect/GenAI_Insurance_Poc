# Sentinel Journal

## 2024-05-19 - [CRITICAL] Prevent Frontend Secret Injection
**Vulnerability:** The `GEMINI_API_KEY` was being injected into the Vite frontend build bundle via `vite.config.ts` and the `chat` method was being executed on the client-side using this key.
**Learning:** Hardcoding or injecting sensitive environment variables into a static frontend configuration allows malicious actors to steal API keys from the bundle. The architecture must always decouple client-side actions from SDKs that require secrets.
**Prevention:** Remove any `define` logic in frontend build configurations (like `vite.config.ts`) that inject API keys. Ensure all SDK requests needing API keys occur server-side by routing frontend requests through an intermediate backend proxy endpoint (e.g., `/api/gemini/chat`).
