with open("components/widgets/Breathing/useBreathing.ts", "r") as f:
    content = f.read()

import re

# Remove the reset call from the effect completely to avoid setState within an effect
content = re.sub(r'  useEffect\(\(\) => \{\n    patternRef\.current = PATTERNS\[patternId\];\n    if \(\!isActive\) \{\n      reset\(\);\n    \}\n  \}, \[patternId\]\);\n\n', '  useEffect(() => {\n    patternRef.current = PATTERNS[patternId];\n  }, [patternId]);\n\n', content)

with open("components/widgets/Breathing/useBreathing.ts", "w") as f:
    f.write(content)
