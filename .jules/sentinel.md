## 2024-08-28 - Hardcoded Frontend Credentials
**Vulnerability:** Client-side hardcoded admin credentials ("shivam" / "charan1") were found in `src/App.tsx`, allowing trivial authentication bypass by inspecting the client bundle.
**Learning:** Purely client-side authentication logic cannot safely hold or verify credentials. Verification must occur on a secure backend.
**Prevention:** Always authenticate against a backend endpoint using server-side environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) rather than hardcoding credentials in the client application.
