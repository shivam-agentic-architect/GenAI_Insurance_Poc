## 2025-02-28 - [Client-Side API Key Exposure Fix]
**Vulnerability:** The Gemini API key was critically exposed in the frontend client code via `vite.config.ts`'s `define` property, injecting the secret into the public browser bundle.
**Learning:** Never expose backend secrets or API keys in frontend configurations or Vite's `define`. These should be handled server-side to prevent credential theft.
**Prevention:** Implement a backend proxy (e.g., an Express API endpoint) to handle all sensitive interactions with AI APIs securely, and ensure only generic responses (like 500 Generic Error) are sent back to the client to avoid information leakage.
