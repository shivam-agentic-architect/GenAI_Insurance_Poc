## 2024-06-13 - [Hardcoded Secrets in Client-side Bundle]
**Vulnerability:** Found hardcoded admin credentials (username and password) directly in `src/App.tsx`.
**Learning:** Hardcoding secrets in frontend code exposes them in the compiled client-side bundle, making them accessible to any user who inspects the application code.
**Prevention:** Always authenticate via a secure backend endpoint using environment variables or a secure database to store and validate credentials. Ensure environment variables meant for the server do not accidentally leak into the client bundle (e.g. avoid prefixing with VITE_).
