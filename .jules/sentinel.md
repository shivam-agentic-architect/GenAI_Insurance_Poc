## 2024-06-05 - Remove API Key Exposure in Client
**Vulnerability:** The `GEMINI_API_KEY` was exposed to clients by statically injecting it into the Vite frontend build through the `define` property in `vite.config.ts`.
**Learning:** Avoid using frontend build configurations (like `vite.config.ts`) to inject sensitive keys into the client-side bundle. Any key injected this way is accessible to end users, potentially leading to unauthorized access and API abuse.
**Prevention:** Always proxy sensitive third-party API requests through a secure server-side endpoint where API keys can be managed via server environment variables, preventing exposure to the frontend.
