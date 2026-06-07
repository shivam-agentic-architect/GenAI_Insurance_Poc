## 2024-05-18 - [CRITICAL] Fix hardcoded frontend credentials
**Vulnerability:** The frontend React code (`src/App.tsx`) contained hardcoded plaintext credentials (`shivam` / `charan1`) used to check if the user could log in. This exposed administrative credentials directly to any user able to view the client-side JavaScript bundle.
**Learning:** Checking credentials on the client side is inherently insecure because all client-side code is visible to the user. Authentication logic must always reside on the server-side.
**Prevention:** Avoid performing authentication logic and hardcoding secrets in frontend frameworks. Always validate credentials using secure backend endpoints and environment variables.
