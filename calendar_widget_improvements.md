Task overview:
Fix the scaling of the calendar widget to be fully aligned with how the Schedule widget works. Additionally, in the calendar widget settings, add a numeric selector option so users can determine how many days' info they want visible at one time. Finally, the create a local event functionality in the calendar widget settings uses native browser alerts to create the event title and date which is just awful and not aligned with the rest of the codebase. This functionality should just happen within the calendar widget settings page.

[ ] Add daysVisible to CalendarConfig in types.ts
[ ] Add daysVisible default in widgetDefaults.ts
[ ] Fix CalendarWidget scaling and add daysVisible filtering
[ ] Replace prompt() with inline form and add daysVisible selector in CalendarSettings
[ ] Run validation and fix any issues
[ ] Commit and push changes
