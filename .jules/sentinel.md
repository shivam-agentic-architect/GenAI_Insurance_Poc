## 2026-06-26 - [DoS and Info Leak]
**Vulnerability:** The /api/upload endpoint lacked a file size limit and failed to guarantee temporary file deletion on error. Additionally, both /api/upload and /api/gpt/ask endpoints leaked raw error messages.
**Learning:** Node.js Express endpoints processing user uploads and communicating with external APIs (like OpenAI) are particularly vulnerable to resource exhaustion and state exposure if proper limits and catch blocks aren't implemented securely.
**Prevention:** Always define limits when using multer, ensure temporary files are deleted using finally blocks, and never return raw internal error messages in API responses.
