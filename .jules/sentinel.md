## 2024-08-04 - [CRITICAL] Prevented API Key Exposure in Client Bundle

**Vulnerability:** The Vite build configuration used the `define` plugin to statically inject the `GEMINI_API_KEY` environment variable into the client-side JavaScript bundle. This meant anyone who downloaded the web application could extract the API key and abuse the associated Google Cloud project/quota.
**Learning:** Hardcoding secrets or statically mapping environment variables (especially non-`VITE_` prefixed ones) directly in `vite.config.ts` exposes them in cleartext in compiled frontend assets.
**Prevention:** Always proxy third-party SDK calls requiring API keys through a secure backend server. In this case, `server.ts` handles the requests via `/api/gemini/chat`, keeping the `GEMINI_API_KEY` safely server-side.
