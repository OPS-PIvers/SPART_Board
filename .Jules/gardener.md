# Gardener's Journal

## 2025-02-18 - [Extracted Complex Audio Logic from TimeToolWidget]

**Weed:** Complex logic (audio synthesis with `AudioContext`) mixed with UI component logic (`TimeToolWidget`).
**Root Cause:** Feature grew over time; audio logic is verbose and was implemented inline.
**Plan:** Extracted to `utils/timeToolAudio.ts` with Singleton pattern and SSR safety.

## 2024-05-23 - Refactor Sidebar and Extract SortableDashboardItem

**Weed:** `Sidebar.tsx` was over 1400 lines and contained a large inner component definition (`SortableDashboardItem`) and duplicated background fetching logic found in `useBackgrounds`.
**Root Cause:** Component grew organically as features were added (boards, backgrounds, widgets) without separating concerns.
**Plan:** Extract sub-components and leverage existing hooks to reduce file size and improve readability/maintainability.
