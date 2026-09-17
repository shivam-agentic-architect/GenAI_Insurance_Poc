## 2024-05-18 - [Fix Hardcoded Secrets]
**Vulnerability:** Gemini API keys were hardcoded into the frontend bundle via `vite.config.ts` using the `define` property.
**Learning:** Hardcoding API keys in frontend configuration exposes them to the public, as Vite statically injects them into the client-side bundle.
**Prevention:** Avoid injecting sensitive API keys via `vite.config.ts`. Instead, use a backend proxy endpoint (e.g., in `server.ts`) to manage sensitive logic and secure API interactions, ensuring secrets remain hidden.
