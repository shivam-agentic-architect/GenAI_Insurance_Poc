## 2024-10-27 - [Resource Exhaustion and Data Leakage]
**Vulnerability:** The `/api/upload` endpoint lacks a file size limit and fails to clean up temporary files if an error occurs during processing (e.g. during embedding generation or PDF parsing). Additionally, HTTP 500 responses return `error.message` back to the client.
**Learning:** Upload handlers must always clean up temp files via `finally` blocks, and enforce hard size limits to prevent DoS via disk space exhaustion. Error details must be generic on the client side to avoid leaking infrastructure or internal state details.
**Prevention:** Always use `try...finally` with `fs.unlinkSync` for multer uploads. Use `limits: { fileSize: LIMIT }` in multer initialization. Do not pass `error.message` to `res.status(500).json()`.
