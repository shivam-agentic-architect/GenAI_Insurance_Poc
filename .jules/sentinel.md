## 2024-05-18 - Client-Side Authentication with Hardcoded Credentials
**Vulnerability:** The React frontend (`src/App.tsx`) contained hardcoded credentials (`shivam` and `charan1`) used to validate login locally on the client-side.
**Learning:** Checking credentials on the client-side is completely insecure, as the source code (including passwords) is bundled and sent to the user's browser. Anyone could bypass login or inspect the bundle to extract the credentials. This is a critical architectural security flaw in web applications.
**Prevention:** Never perform authentication validation in client-side code. Always send credentials to a secure backend endpoint (like `/api/login`) and validate them against server-side secrets (e.g., environment variables) or a database.
