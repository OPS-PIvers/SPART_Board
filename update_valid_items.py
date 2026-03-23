with open("components/widgets/Schedule/Settings.tsx", "r") as f:
    content = f.read()

old_str = """  const validItems =
    selectedSchedule?.items.filter(
      (i): i is ScheduleItem & { id: string } => !!i.id
    ) ?? [];"""

new_str = """  const validItems = selectedSchedule?.items.filter(
    (i): i is ScheduleItem & { id: string } => !!i.id
  ) ?? [];"""

if old_str in content:
    with open("components/widgets/Schedule/Settings.tsx", "w") as f:
        f.write(content.replace(old_str, new_str))
    print("Replaced")
else:
    print("Not found")
