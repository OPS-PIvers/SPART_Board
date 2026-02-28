import re

with open("config/tools.ts", "r") as f:
    content = f.read()

# Add Wind import to top
content = content.replace("Wand2,\n} from", "Wand2,\n  Wind,\n} from")

quiz_tool = """  {
    type: 'quiz',
    icon: ClipboardList,
    label: 'Quiz',
    color: 'bg-violet-600',
  },"""

breathing_tool = """  {
    type: 'quiz',
    icon: ClipboardList,
    label: 'Quiz',
    color: 'bg-violet-600',
  },
  {
    type: 'breathing',
    icon: Wind,
    label: 'Breathing',
    color: 'bg-sky-400',
  },"""

content = content.replace(quiz_tool, breathing_tool)

with open("config/tools.ts", "w") as f:
    f.write(content)
