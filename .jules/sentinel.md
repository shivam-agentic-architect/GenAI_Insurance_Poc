## 2024-05-18 - Hardcoded Credentials in Frontend Auth

**Vulnerability:** Found hardcoded administrative credentials (`"shivam"` / `"charan1"`) directly in `src/App.tsx` client-side validation logic.
**Learning:** Client-side authentication checks can be easily bypassed or inspected, exposing credentials. Authentication must always happen on the server, and credentials should never be in version control or distributed to the client.
**Prevention:** Always implement backend authentication endpoints (e.g., `/api/login`) that validate against server-side environment variables or a database. Never store credentials in the client code.
