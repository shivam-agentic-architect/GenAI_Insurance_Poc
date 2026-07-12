## 2024-05-18 - [Hardcoded Admin Credentials in Frontend]
 **Vulnerability:** The React application (`src/App.tsx`) contained hardcoded credentials (`shivam` / `charan1`) used to check login status on the client side. This exposes the admin credentials to anyone who inspects the frontend bundle, allowing for complete auth bypass.
 **Learning:** Client-side authentication checks inherently expose the validation logic and expected secrets to the user.
 **Prevention:** Move all authentication and credential validation logic to a secure backend endpoint (like `/api/login`), and use environment variables (e.g., `ADMIN_USERNAME`, `ADMIN_PASSWORD`) to manage secrets instead of hardcoding them into the source code.
