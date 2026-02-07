import sys

filepath = 'components/admin/FeaturePermissionsManager.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# Add imports
if "import { CatalystPermissionEditor } from './CatalystPermissionEditor';" not in content:
    content = content.replace(
        "import { getRoutineColorClasses } from '../widgets/InstructionalRoutines/colorHelpers';",
        "import { getRoutineColorClasses } from '../widgets/InstructionalRoutines/colorHelpers';\nimport { CatalystPermissionEditor } from './CatalystPermissionEditor';"
    )
if "CatalystGlobalConfig," not in content:
    content = content.replace(
        "WidgetType,",
        "WidgetType,\n  CatalystGlobalConfig,"
    )

# Add Catalyst Editor Block
catalyst_block = """
                  {tool.type === 'catalyst' && (
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
                  )}

"""

if "{tool.type === 'catalyst' && (" not in content:
    # Find the exclusion check
    exclusion_marker = "{!['lunchCount', 'weather', 'instructionalRoutines'"
    if exclusion_marker in content:
        content = content.replace(exclusion_marker, catalyst_block + exclusion_marker)

# Update exclusion list
content = content.replace(
    "{!['lunchCount', 'weather', 'instructionalRoutines'].includes(",
    "{!['lunchCount', 'weather', 'instructionalRoutines', 'catalyst'].includes("
)

with open(filepath, 'w') as f:
    f.write(content)

print("Modified FeaturePermissionsManager.tsx")
