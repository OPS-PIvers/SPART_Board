import re

with open('components/widgets/TimeTool/TimeToolWidget.tsx', 'r') as f:
    content = f.read()

# Look for the sound picker button and fix it
# We want to move the closing backtick of className BEFORE the style prop
pattern = r'(className={`flex items-center rounded-full transition-all border shadow-sm \$\{.*?)\s+style={{ gap: "min\(6px, 1.5cqmin\)", padding: "min\(6px, 1.5cqmin\) min\(12px, 3cqmin\)" }}`}'
replacement = r'\1`} style={{ gap: "min(6px, 1.5cqmin)", padding: "min(6px, 1.5cqmin) min(12px, 3cqmin)" }}'

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('components/widgets/TimeTool/TimeToolWidget.tsx', 'w') as f:
    f.write(content)
