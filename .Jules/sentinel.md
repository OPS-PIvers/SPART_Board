## 2025-02-12 - Stored XSS in ContentEditable

**Vulnerability:** The `TextWidget` used `dangerouslySetInnerHTML` with `contentEditable` content that was saved directly from `innerHTML` without sanitization. This allowed stored XSS if a user pasted malicious scripts.
**Learning:** `DOMParser` is a viable zero-dependency alternative to `dompurify` for basic sanitization in browser environments, but tests must account for HTML normalization (e.g., `<br/>` to `<br>`).
**Prevention:** Always sanitize user-generated HTML before persistence. Use the new `sanitizeHtml` utility in `utils/security.ts` for any future rich-text requirements.
