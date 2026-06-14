## 2025-06-14 - Missing File Size Limit in Multer Uploads
 **Vulnerability:** The `/api/upload` endpoint in `server.ts` used `multer` for file uploads without any file size limit configuration. This allowed an attacker to upload extremely large files, leading to memory exhaustion or disk space exhaustion, potentially causing a Denial of Service (DoS) and application crash.
 **Learning:** Multer, by default, does not enforce any file size limits. It is crucial to always configure file size limits when accepting user uploads.
 **Prevention:** Always configure `limits.fileSize` when setting up `multer` in an Express application and catch `multer.MulterError` with code `LIMIT_FILE_SIZE` to return a clear 400 Bad Request error without leaking stack traces.
