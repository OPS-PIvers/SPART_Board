import re

with open('components/widgets/ConceptWeb/Settings.tsx', 'r') as f:
    content = f.read()

content = content.replace("config.fontFamily || 'sans'", "config.fontFamily ?? 'sans'")

with open('components/widgets/ConceptWeb/Settings.tsx', 'w') as f:
    f.write(content)

with open('components/widgets/ConceptWeb/Widget.tsx', 'r') as f:
    content = f.read()

content = content.replace("config.fontFamily || 'inherit'", "config.fontFamily ?? 'inherit'")
content = content.replace("const nodes = config.nodes || [];", "const nodes = config.nodes ?? [];")
content = content.replace("const edges = config.edges || [];", "const edges = config.edges ?? [];")

with open('components/widgets/ConceptWeb/Widget.tsx', 'w') as f:
    f.write(content)
