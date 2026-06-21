## 2024-06-21 - Remove Hardcoded Credentials in Client Bundle
**Vulnerability:** The application was previously using hardcoded admin credentials ("shivam", "charan1") directly in the `src/App.tsx` frontend React code to handle login logic, which exposes secrets in the compiled JavaScript bundle.
**Learning:** Client-side static files are accessible to any user who inspects the sources. Relying on hardcoded values in client-side code bypasses authentication safeguards.
**Prevention:** Always handle authentication securely on the backend server by validating credentials against environment variables or a database. Never hardcode sensitive information like usernames and passwords in the frontend codebase.
