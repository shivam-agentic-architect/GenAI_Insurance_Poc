## 2024-05-15 - Hardcoded Client-Side Credentials Bypass
**Vulnerability:** The application was using hardcoded credentials (`shivam` and `charan1`) directly in the client-side `App.tsx` React component for authentication. Anyone could inspect the frontend source code and bypass the login.
**Learning:** Client-side authentication checks offer zero security since all client code is inherently accessible to the end user. Authentication must always be performed server-side where secrets and validation logic can be kept secure.
**Prevention:** Always implement an authentication backend endpoint (e.g., `/api/login`) that validates user credentials against a secure datastore or server-side environment variables. Ensure no hardcoded credentials are ever shipped in the client bundle.
