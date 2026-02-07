import re

filepath = 'components/admin/FeaturePermissionsManager.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# Add CatalystGlobalConfig to imports if not present
if "CatalystGlobalConfig," not in content:
    content = re.sub(
        r'import \{[^}]*WidgetType,[^}]*\}',
        lambda m: m.group(0).replace('WidgetType,', 'WidgetType, CatalystGlobalConfig,'),
        content
    )

# Add CatalystPermissionEditor import if not present
if "import { CatalystPermissionEditor } from './CatalystPermissionEditor';" not in content:
    content = content.replace(
        "import { getRoutineColorClasses } from '../widgets/InstructionalRoutines/colorHelpers';",
        "import { getRoutineColorClasses } from '../widgets/InstructionalRoutines/colorHelpers';\nimport { CatalystPermissionEditor } from './CatalystPermissionEditor';"
    )

# Rewrite Catalyst Block
catalyst_regex = r"\{tool\.type === 'catalyst'.*?\)\}"
catalyst_block = """{tool.type === 'catalyst' && (
                    <div className="space-y-4">
                      <CatalystPermissionEditor
                        config={(permission.config ?? {}) as unknown as CatalystGlobalConfig}
                        onChange={(newConfig) =>
                          updatePermission(tool.type, {
                            config: newConfig as unknown as Record<string, unknown>,
                          })
                        }
                      />
                    </div>
                  )}"""

# Replace existing partial block
content = re.sub(catalyst_regex, catalyst_block, content, flags=re.DOTALL)

with open(filepath, 'w') as f:
    f.write(content)

print("Fixed FeaturePermissionsManager.tsx")
