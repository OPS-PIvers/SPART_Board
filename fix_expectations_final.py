import re

with open('components/widgets/ExpectationsWidget.tsx', 'r') as f:
    content = f.read()

# Fix Volume button
content = re.sub(
    r'(className={`flex-1 flex items-center rounded-2xl border-2 transition-all group \$\{.*?isElementary \? \'col-span-2\' : \'\'\}\`})',
    r'\1 style={{ gap: "min(16px, 4cqmin)", padding: "min(16px, 4cqmin)" }}',
    content,
    flags=re.DOTALL
)

# Fix Groups and Interaction buttons
content = re.sub(
    r'(className={`flex-1 flex items-center rounded-2xl border-2 transition-all group \$\{(?!.*?isElementary).*?\}\`})(?! style=)',
    r'\1 style={{ gap: "min(16px, 4cqmin)", padding: "min(16px, 4cqmin)" }}',
    content,
    flags=re.DOTALL
)

with open('components/widgets/ExpectationsWidget.tsx', 'w') as f:
    f.write(content)
