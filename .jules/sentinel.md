
## 2025-02-27 - [CRITICAL] Client-Side Hardcoded Credentials in Vite React App
**Vulnerability:** The Vite React frontend (`src/App.tsx`) contained hardcoded credentials (`username === "shivam" && password === "charan1"`) for authentication validation. This allows any user who inspects the frontend bundle to easily extract the credentials and bypass authentication.
**Learning:** Client-side routing and state (`isLoggedIn`) must never handle security decisions like verifying credentials, since all client-side code is fully exposed.
**Prevention:** Always perform authentication validation on a secure backend server (like the Node.js Express `server.ts`) and validate against environment variables or a database. The client should only send credentials to an API endpoint (`/api/login`) and handle the response.
