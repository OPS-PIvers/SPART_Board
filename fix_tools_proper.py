import re

with open("config/tools.ts", "r") as f:
    content = f.read()

# Fix the lucide imports
content = re.sub(r'  Wind,\n\s+Wand2,\n', r'  Wand2,\n  Wind,\n', content)

# Fix the TOOLS array
# Find the start of the record tool
idx_record = content.find("  {\n    type: 'record'")
idx_quiz = content.find("  {\n    type: 'pdf'") # Find pdf instead of quiz because quiz is messed up

if idx_quiz != -1 and idx_record != -1:
    before = content[:idx_quiz]
    after = content[idx_record:]

    pdf_quiz_breathing = """  {
    type: 'pdf',
    icon: FileText,
    label: 'PDF Viewer',
    color: 'bg-red-700',
  },
  {
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
  },
"""
    content = before + pdf_quiz_breathing + after

# Fix the end magic section
content = re.sub(r'  {\n    type: \'magic\',\n    icon: Wand2,\n\s*Wind,\n\s*label: \'Magic\',',
                 r'  {\n    type: \'magic\',\n    icon: Wand2,\n    label: \'Magic\',', content)

with open("config/tools.ts", "w") as f:
    f.write(content)
