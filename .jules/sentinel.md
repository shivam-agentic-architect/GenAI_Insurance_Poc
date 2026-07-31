## 2026-07-31 - Unbounded Uploads and Orphaned Temp Files
**Vulnerability:** The `/api/upload` endpoint lacks a file size limit and fails to clean up temporary files if processing errors occur, leading to potential resource exhaustion (DoS) and disk space filling up with orphaned files. Additionally, sensitive error messages were leaked on 500 errors.
**Learning:** Temporary files created by `multer` must be cleaned up in a `finally` block to guarantee execution, as parsing (e.g., `PDFParse`) or embedding can throw exceptions.
**Prevention:** Always implement `limits: { fileSize: LIMIT }` in `multer` configuration and wrap file processing logic in `try...finally` blocks with `fs.unlinkSync(file.path)` inside the `finally` block. Return generic messages for 500 status codes.
