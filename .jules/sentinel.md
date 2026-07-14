## 2024-05-24 - [Fix hardcoded frontend credentials]
**Vulnerability:** Hardcoded login credentials (`shivam` / `charan1`) were found in the frontend source code (`src/App.tsx`), allowing authentication bypass by anyone inspecting the client-side bundle.
**Learning:** Frontend authentication checks are inherently insecure because the client bundle is public. Authentication must always be handled on the server.
**Prevention:** Never use hardcoded fallback values or hardcode credentials in frontend code. Always authenticate via a secure backend endpoint using environment variables.
