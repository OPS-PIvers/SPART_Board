# Gardener's Journal

## 2025-02-18 - [Extracted Complex Audio Logic from TimeToolWidget]
**Weed:** Complex logic (audio synthesis with `AudioContext`) mixed with UI component logic (`TimeToolWidget`).
**Root Cause:** Feature grew over time; audio logic is verbose and was implemented inline.
**Plan:** Extracted to `utils/timeToolAudio.ts` with Singleton pattern and SSR safety.
