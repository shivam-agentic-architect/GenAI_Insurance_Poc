## 2024-11-02 - [Critical] Exposed API Keys in Frontend Code
**Vulnerability:** The `vite.config.ts` uses the `define` option to inject `process.env.GEMINI_API_KEY` directly into the client-side JavaScript bundle.
**Learning:** Vite's `define` property does global string replacement. Injecting server secrets this way exposes them in plaintext in the user's browser, allowing anyone to extract and misuse the API key. The architecture is flawed because `src/lib/gemini.ts` runs directly on the frontend.
**Prevention:** Never inject server secrets into the client bundle. Move sensitive SDK calls (like GoogleGenAI) entirely to a backend proxy endpoint.
