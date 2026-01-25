## 2024-05-23 - Data Liberation via Client-Side Export
**Discovery:** Widget data (like `ChecklistWidget` items) is stored in `widget.config` but often trapped in the UI.
**Opportunity:** Client-side CSV generation using `Blob` and `URL.createObjectURL` is a zero-backend way to export this data. This pattern is highly reusable for other widgets like `PollWidget` (results) and `ScoreboardWidget` (scores) to add immediate value.
