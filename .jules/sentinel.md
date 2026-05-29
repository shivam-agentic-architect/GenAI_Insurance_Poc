## 2024-05-29 - Hardcoded credentials in App.tsx

**Vulnerability:** A hardcoded username and password ("shivam" and "charan1") were found in the frontend code (`src/App.tsx`) to mock authentication. This could be exposed in the bundled output.
**Learning:** Hardcoded credentials should never be included directly in the source code, even for a simple POC, as it is exposed in client-side code and commit history. Also, frontend environment variables (`VITE_` prefixed) are still bundled and sent to the client, which still exposes the password.
**Prevention:** Move authentication logic to the backend and use a secure backend endpoint to perform authentication checks, rather than returning environment variables in the frontend bundle.
