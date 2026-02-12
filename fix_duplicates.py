import re

with open('components/widgets/ExpectationsWidget.tsx', 'r') as f:
    content = f.read()

# Remove duplicate style props on the same element
# Match style={...} followed by whitespace and another style={...}
content = re.sub(
    r'(style={{.*?}})\s+style={{.*?}}',
    r'\1',
    content,
    flags=re.DOTALL
)

with open('components/widgets/ExpectationsWidget.tsx', 'w') as f:
    f.write(content)
