## 2024-06-22 - Found Hardcoded Credentials
**Vulnerability:** Found hardcoded credentials `shivam` / `charan1` in `src/App.tsx` for client-side authentication.
**Learning:** Hardcoded credentials on the client-side provide zero security and can be easily bypassed or extracted.
**Prevention:** Always authenticate on the backend and never store credentials in the client code.
