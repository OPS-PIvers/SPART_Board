import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Fix multiple style attributes in InstructionalRoutines/Widget.tsx
    # Merge them: style={{ ... }} style={scalingStyles} -> style={{ ...scalingStyles, ... }}
    content = re.sub(
        r'style={{ (.*?) }}\s+style={scalingStyles}',
        r'style={{ ...scalingStyles, \1 }}',
        content
    )

    # 2. Fix misplaced style props (outside tags but before closing brace/backtick)
    # This happened in MiniAppWidget and WebcamWidget
    # Example: <div ...> style={{ ... }} {condition ? ...} </div>
    # We want: <div ... style={{ ... }}> {condition ? ...} </div>

    # Specifically for MiniAppWidget and WebcamWidget where I saw the error
    content = re.sub(
        r'(<div[^>]*?)\s*>\s+style={{ (.*?) }}\s+({)',
        r'\1 style={{ \2 }}>\n          \3',
        content
    )

    with open(filepath, 'w') as f:
        f.write(content)

# Apply to relevant files
fix_file('components/widgets/InstructionalRoutines/Widget.tsx')
fix_file('components/widgets/MiniAppWidget.tsx')
fix_file('components/widgets/WebcamWidget.tsx')
