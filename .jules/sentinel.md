## 2024-05-31 - Hardcoded Authentication Credentials in Frontend
**Vulnerability:** Found hardcoded plaintext credentials (`shivam` / `charan1`) in the `handleLogin` function in `src/App.tsx`.
**Learning:** Hardcoded secrets in client-side code (like React) are trivially exposed to end users via source code or bundled javascript. Moving credentials to VITE_ environment variables does NOT fix this, as Vite injects those into the bundled client-side code, keeping them fully exposed to users.
**Prevention:** Never perform authentication validation on the client-side. Always use a secure backend endpoint for validating credentials and issue secure tokens or cookies for session management.
