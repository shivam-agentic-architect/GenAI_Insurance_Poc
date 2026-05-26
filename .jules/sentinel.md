## 2025-05-26 - [DoS & Info Leakage Prevention]
**Vulnerability:** The `/api/upload` endpoint did not guarantee cleanup of uploaded files via multer in case of unsupported file types or server errors. The `/api/upload` and `/api/gpt/ask` endpoints leaked internal error messages such as stack traces.
**Learning:** In Node.js APIs, temporary files from middlewares like multer must always be deleted in a `finally` block or handled explicitly in every `return` or `catch` path. Uncaught errors in unhandled paths can cause disk space exhaustion (DoS). Internal server errors should never be directly sent to users.
**Prevention:** Use `try...finally` to ensure resources are cleaned up. Always return generic error messages on HTTP 500 status codes.
