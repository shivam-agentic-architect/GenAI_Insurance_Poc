## 2024-05-27 - Hardcoded API Key Leak via vite.config.ts
**Vulnerability:** The `vite.config.ts` exposes `GEMINI_API_KEY` to the client side via the `define` property.
**Learning:** `process.env.GEMINI_API_KEY` is statically injected into the client-side bundle. They must never be used to store sensitive credentials. The backend proxy must be used instead.
**Prevention:** Do not use `define` to inject secrets.
## 2024-05-27 - Hardcoded API Key Leak via vite.config.ts
**Vulnerability:** The \`vite.config.ts\` exposes \`GEMINI_API_KEY\` to the client side via the \`define\` property, allowing direct access to the Google GenAI SDK from the browser.
**Learning:** \`process.env.GEMINI_API_KEY\` should never be statically injected into the client-side bundle. They must never be used to store sensitive credentials. AI requests should always be proxied through the backend.
**Prevention:** Do not use \`define\` to inject secrets in Vite, and ensure SDK calls are made server-side.
