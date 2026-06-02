## 2023-10-27 - Hardcoded Client-Side Admin Credentials

 **Vulnerability:** Admin login credentials (`"shivam"` / `"charan1"`) were hardcoded directly in the frontend component (`src/App.tsx`), exposing them to anyone who inspects the client-side bundle.
 **Learning:** In this POC application, authentication was initially treated as a pure UI state transition without any server-side validation or secure credential storage, a common pitfall in rapid prototyping.
 **Prevention:** Implement authentication checks on the server side (e.g., via a `/api/login` endpoint). Ensure all credentials and secrets are managed via environment variables on the backend and never statically compiled into the client bundle.
