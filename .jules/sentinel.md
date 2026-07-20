## 2024-05-24 - Resource Exhaustion & Information Leakage in API
**Vulnerability:** The `/api/upload` endpoint was susceptible to resource exhaustion attacks due to unbounded file uploads and failing to delete temporary files if an error occurred during text extraction. Furthermore, both `/api/upload` and `/api/gpt/ask` endpoints returned the raw internal `error.message` on HTTP 500, leaking sensitive application/server details.
**Learning:** File upload endpoints must explicitly configure size limits (e.g., via `multer` limits). Temporary files created during the request lifecycle must be reliably deleted using a `try...finally` block. Catch blocks should not pass raw exceptions to the client; they should log the raw error server-side and return generic, safe messages.
**Prevention:**
1. Use `limits: { fileSize: LIMIT }` in file upload middleware configurations.
2. Wrap complex upload processing logic in `try { ... } finally { /* cleanup file */ }`.
3. Standardize error handling to return generic 500 responses like `{ error: "An unexpected error occurred" }` and use `console.error` for the stack trace.
