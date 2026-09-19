## 2023-10-27 - [CRITICAL] Prevent API Key Exposure to Client

**Vulnerability:** The `GEMINI_API_KEY` was exposed to the frontend client via `vite.config.ts`'s `define` property. `src/lib/gemini.ts` executed direct `@google/genai` calls in the browser, making the API key accessible to any user viewing the page source or network tab.

**Learning:** Any environment variable injected into Vite's `define` block is statically replaced in the client-side bundle. AI SDK calls should never be made directly from the client using sensitive keys unless they are restricted by origin (not possible with most direct API keys).

**Prevention:** Always proxy AI SDK calls and other sensitive operations through a secure backend endpoint (like `/api/gemini/chat` in Node/Express). Remove any `process.env.SECRET_KEY` definitions from `vite.config.ts`.
