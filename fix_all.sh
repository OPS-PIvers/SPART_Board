#!/bin/bash
# types.ts
sed -i '/export interface GraphicOrganizerConfig {/i \
export interface ConceptNode {\n  id: string;\n  text: string;\n  x: number;\n  y: number;\n  bgColor?: string;\n}\n\nexport interface ConceptEdge {\n  id: string;\n  sourceNodeId: string;\n  targetNodeId: string;\n  label?: string;\n  lineStyle: '"'"'solid'"'"' | '"'"'dashed'"'"';\n}\n\nexport interface ConceptWebConfig {\n  nodes: ConceptNode[];\n  edges: ConceptEdge[];\n  fontFamily?: GlobalFontFamily;\n}\n' types.ts

sed -i '/| '"'"'graphic-organizer'"'"'/a \  | '"'"'concept-web'"'"'' types.ts

sed -i '/| GraphicOrganizerConfig/a \  | ConceptWebConfig' types.ts

sed -i '/? GraphicOrganizerConfig/a \                                                                                        : T extends '"'"'concept-web'"'"'\n                                                                                          ? ConceptWebConfig' types.ts

# WidgetRegistry.ts
sed -i '/'"'"'graphic-organizer'"'"': lazyNamed(/i \  '"'"'concept-web'"'"': lazyNamed(\n    () => import('"'"'./ConceptWeb/Widget'"'"'),\n    '"'"'ConceptWebWidget'"'"'\n  ),' components/widgets/WidgetRegistry.ts

sed -i '/'"'"'graphic-organizer'"'"': lazyNamed(/i \  '"'"'concept-web'"'"': lazyNamed(\n    () => import('"'"'./ConceptWeb/Settings'"'"'),\n    '"'"'ConceptWebSettings'"'"'\n  ),' components/widgets/WidgetRegistry.ts

sed -i '/'"'"'graphic-organizer'"'"': {/i \  '"'"'concept-web'"'"': {\n    baseWidth: 800,\n    baseHeight: 600,\n    canSpread: true,\n    skipScaling: true,\n    padding: 0,\n  },' components/widgets/WidgetRegistry.ts

# config/tools.ts
sed -i '/import {/a \  Network,' config/tools.ts

sed -i '/type: '"'"'graphic-organizer'"'"',/i \  {\n    type: '"'"'concept-web'"'"',\n    icon: Network,\n    label: '"'"'Concept Web'"'"',\n    color: '"'"'bg-purple-600'"'"',\n  },' config/tools.ts

# config/widgetDefaults.ts
sed -i '/GraphicOrganizerConfig,/a \  ConceptWebConfig,' config/widgetDefaults.ts

sed -i '/'"'"'graphic-organizer'"'"': {/i \  '"'"'concept-web'"'"': {\n    w: 800,\n    h: 600,\n    config: {\n      nodes: [],\n      edges: [],\n    } as ConceptWebConfig,\n  },' config/widgetDefaults.ts

# config/widgetGradeLevels.ts
sed -i '/'"'"'graphic-organizer'"'"':/a \  '"'"'concept-web'"'"': ['"'"'k-2'"'"', '"'"'3-5'"'"', '"'"'6-8'"'"', '"'"'9-12'"'"'],' config/widgetGradeLevels.ts
