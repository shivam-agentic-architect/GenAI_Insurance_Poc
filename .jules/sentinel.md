## 2024-05-18 - [CRITICAL] Fix hardcoded authentication credentials
**Vulnerability:** The frontend application contained hardcoded credentials (`shivam` / `charan1`) in `src/App.tsx` for logging in.
**Learning:** Client-side authentication checks using hardcoded values are fundamentally insecure because the logic and credentials are part of the client bundle sent to the user's browser, allowing anyone to bypass the authentication or extract the credentials.
**Prevention:** Always implement authentication logic on the backend. Store credentials securely using environment variables or a database. Validate user input against these secure, server-side sources.
