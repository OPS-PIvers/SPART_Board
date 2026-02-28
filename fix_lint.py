import os
import re

# Fix BreathingSettings.tsx
with open("components/widgets/Breathing/BreathingSettings.tsx", "r") as f:
    content = f.read()
content = content.replace("import { useTranslation } from 'react-i18next';\n", "")
with open("components/widgets/Breathing/BreathingSettings.tsx", "w") as f:
    f.write(content)

# Fix BreathingWidget.tsx
with open("components/widgets/Breathing/BreathingWidget.tsx", "r") as f:
    content = f.read()
content = content.replace("import { useTranslation } from 'react-i18next';\n", "")
content = content.replace("  const { t } = useTranslation();\n", "")
with open("components/widgets/Breathing/BreathingWidget.tsx", "w") as f:
    f.write(content)

# Fix BreathingVisuals.tsx
with open("components/widgets/Breathing/BreathingVisuals.tsx", "r") as f:
    content = f.read()
content = re.sub(r'(case \'lotus\':\n)(\s+)(const numPetals = 8;\n)', r'\1\2{\n\3', content)
content = re.sub(r'(transitionDuration: \'50ms\'\n\s+}}\n\s+/>\n\s+</div>\n\s+);)', r'\1\n        }', content)
with open("components/widgets/Breathing/BreathingVisuals.tsx", "w") as f:
    f.write(content)

# Fix useBreathing.ts
with open("components/widgets/Breathing/useBreathing.ts", "r") as f:
    content = f.read()

# Move reset above the useEffect
reset_func = """  const reset = useCallback(() => {
    setIsActive(false);
    setPhase('ready');
    setTimeLeft(0);
    setProgress(0);
  }, []);"""

content = content.replace(reset_func, "")
content = content.replace("  // Update phase durations when pattern changes", reset_func + "\n\n  // Update phase durations when pattern changes")

# Fix missing deps
content = content.replace("}, [patternId]);", "}, [patternId, isActive, reset]);")

with open("components/widgets/Breathing/useBreathing.ts", "w") as f:
    f.write(content)
