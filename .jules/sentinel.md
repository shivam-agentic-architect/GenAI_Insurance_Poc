## 2024-05-24 - Hardcoded Credentials in Client Bundle
**Vulnerability:** Found hardcoded credentials (`username === "shivam" && password === "charan1"`) in `src/App.tsx`. Because Vite bundles this code and sends it to the client, the plaintext credentials were fully exposed.
**Learning:** Client-side React applications cannot securely store credentials or perform their own authentication. Storing them in components leaks secrets to anyone inspecting the Javascript bundle.
**Prevention:** Always handle authentication via backend APIs (`/api/login`), reading credentials from secure environment variables (`process.env`) on the Node.js server.
