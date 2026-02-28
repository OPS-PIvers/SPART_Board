import re

with open("config/tools.ts", "r") as f:
    content = f.read()

# Add Wind import
content = re.sub(r'  ClipboardList,\n  Wand2,\n} from', r'  ClipboardList,\n  Wand2,\n  Wind,\n} from', content)

# Fix the TOOLS array
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
