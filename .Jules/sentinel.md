## 2025-02-12 - Stored XSS in ContentEditable

**Vulnerability:** The `TextWidget` saved `contentEditable` `innerHTML` to persistence without sanitization, then rendered that stored HTML with `dangerouslySetInnerHTML`. The lack of sanitization on user-controlled HTML before saving allowed stored XSS if a user pasted malicious scripts.
**Learning:** `DOMParser` is a viable zero-dependency alternative to `dompurify` for basic sanitization in browser environments, but tests must account for HTML normalization (e.g., `<br/>` to `<br>`).
**Prevention:** Always sanitize user-generated HTML before persistence. Use the new `sanitizeHtml` utility in `utils/security.ts` for any future rich-text requirements.
