## 2024-07-06 - Missing upload limits and cleanup on /api/upload
**Vulnerability:** File upload DoS and temporary file disk exhaustion. The `/api/upload` endpoint using `multer` did not have a file size limit. Also, if an error occurred during PDF parsing or embedding, the temporary file was not deleted, which could lead to disk exhaustion over time. Furthermore, the endpoint leaked raw error messages to the client.
**Learning:** Always set `limits: { fileSize: X }` when configuring `multer` to prevent massive uploads. Always use a `try...finally` block to guarantee cleanup of uploaded files, regardless of whether processing succeeds or fails. Never send raw `error.message` to clients in error responses.
**Prevention:**
- Enforce size limits on all file upload endpoints.
- Ensure any temporary files created by upload handlers are explicitly deleted in a `finally` block to handle both success and error paths.
- Log raw error details server-side but return generic, safe error messages to clients.
