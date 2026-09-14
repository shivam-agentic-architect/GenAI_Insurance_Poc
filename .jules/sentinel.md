## 2025-03-01 - [CRITICAL] Fix Exposed Gemini API Key in Frontend
**Vulnerability:** The `GEMINI_API_KEY` was being injected into the client-side bundle via `vite.config.ts`'s `define` property, and the Gemini API was being called directly from the frontend (`src/lib/gemini.ts`), exposing the secret to the browser.
**Learning:** Never inject sensitive API keys into the frontend using build tools like Vite. Ensure AI SDK calls (e.g. `@google/genai`) are proxyed through the backend.
**Prevention:** Migrate API calls and secret key usage to backend endpoints, using a secure proxy strategy (e.g., creating an `/api/gemini/chat` route in `server.ts`) instead of direct client-side integration.
