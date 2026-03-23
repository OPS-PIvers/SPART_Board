with open("components/widgets/Schedule/components/SortableScheduleItem.tsx", "r") as f:
    content = f.read()

old_str1 = """            onChange={(e) =>
              onUpdate(item.id, { task: e.target.value })
            }"""

new_str1 = """            onChange={(e) => onUpdate(item.id, { task: e.target.value })}"""

old_str2 = """            onChange={(e) =>
              onUpdate(item.id, { endTime: e.target.value })
            }"""

new_str2 = """            onChange={(e) => onUpdate(item.id, { endTime: e.target.value })}"""


if old_str1 in content:
    content = content.replace(old_str1, new_str1)
    print("Replaced 1")

if old_str2 in content:
    content = content.replace(old_str2, new_str2)
    print("Replaced 2")

with open("components/widgets/Schedule/components/SortableScheduleItem.tsx", "w") as f:
    f.write(content)
