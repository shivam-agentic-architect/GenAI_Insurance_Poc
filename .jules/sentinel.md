## 2024-03-24 - [Client-Side Authentication Bypass]
**Vulnerability:** Admin credentials ("shivam" / "charan1") were hardcoded in `src/App.tsx` and the authentication check was performed entirely on the client-side, allowing anyone to bypass the login screen by modifying the client state or reading the credentials from the source code.
**Learning:** Client-side authentication provides no real security as the code is fully accessible to users. Authentication must always happen on the server.
**Prevention:** Implement a server-side authentication endpoint (`/api/login`) that securely checks credentials against environment variables and issues a session/token, rather than relying on client-side string comparison.
