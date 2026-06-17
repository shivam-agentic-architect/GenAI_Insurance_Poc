## 2025-02-28 - Avoid VITE_ static injection of credentials
**Vulnerability:** Fixing hardcoded frontend credentials by moving them to `.env` variables prefixed with `VITE_` statically injects them to the client bundle at build-time. This provides zero security as the credentials can be extracted.
**Learning:** Never prefix credentials with `VITE_` or use them in frontend client code. Client code is public by definition. Also, server-side authentication should not use hardcoded fallback default credentials.
**Prevention:** Perform authentication server-side against backend environment variables (e.g., `ADMIN_PASSWORD`), without default fallbacks.
