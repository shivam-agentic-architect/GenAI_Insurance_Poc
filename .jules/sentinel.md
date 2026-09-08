## 2025-03-08 - [API Key Client Leak]
**Vulnerability:** GEMINI_API_KEY was being directly injected into the client-side JavaScript bundle via the `define` block in `vite.config.ts`, exposing the secret to the browser.
**Learning:** Build tools like Vite can easily expose server environment variables to the frontend if they are explicitly mapped in config files. The `chat` function was also configured to make client-side LLM calls which necessitated this exposure.
**Prevention:** Never inject secrets into client-side bundles. Always proxy third-party AI or SDK calls requiring sensitive credentials through a secure backend endpoint (like `server.ts`) where the secret is accessed safely from the server environment.
