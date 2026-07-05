
## 2025-02-24 - [CRITICAL] File Upload Resource Exhaustion & Info Leak
**Vulnerability:** The `/api/upload` endpoint using `multer` lacked file size limits and failed to clean up temporary files on early returns (e.g. invalid file types), leading to disk exhaustion DoS. Additionally, catch blocks exposed raw `error.message` to clients.
**Learning:** Always use `try...finally` blocks for temporary file cleanup to ensure resources are freed even on validation failures or errors. Do not trust user inputs for file size or type without strict server-side limits.
**Prevention:** Configure `multer` with `limits: { fileSize: X }`. Enclose temporary file usage in `try...finally` and check `fs.existsSync` before unlinking. Return generic error messages from catch blocks to prevent info leakage.
