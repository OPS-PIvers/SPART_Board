# Curator Journal

## 2025-02-23 - [Security Fix] **Blocker:** @types/node **Reason:** Production uses node:20-alpine, so we must stick to @types/node v20 or v22 (compatible) and not upgrade to v25 yet. **Plan:** Pinned in package.json.

## 2025-02-23 - [Security Fix] **Vulnerability Pattern:** tar **Reason:** High severity (Arbitrary File Overwrite) in tar <=7.5.2, pulled in by firebase-tools > superstatic > re2 > node-gyp. **Plan:** Added pnpm override to force tar ^7.5.3.
