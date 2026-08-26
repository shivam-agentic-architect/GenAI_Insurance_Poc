## 2024-05-27 - Hardcoded Client-Side Credentials
**Vulnerability:** Hardcoded login credentials found in React frontend component (`src/App.tsx`).
**Learning:** Authentication logic was implemented directly in the frontend component instead of delegating to a secure backend endpoint, exposing credentials to all users in the compiled JavaScript bundle.
**Prevention:** Always implement authentication validation on the server-side and proxy login requests from the frontend to a backend endpoint. Ensure server-side credentials are dynamically loaded from environment variables and not hardcoded anywhere.
