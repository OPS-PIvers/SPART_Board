import re

# Patch config/tools.ts
with open('config/tools.ts', 'r') as f:
    content = f.read()

import_network = "import { Network } from 'lucide-react';\n"
if "import { Network" not in content:
    content = content.replace("from 'lucide-react';", "from 'lucide-react';\n" + import_network)

widget_entry = """  {
    type: 'concept-web',
    icon: Network,
    label: 'Concept Web',
    color: 'bg-purple-600',
  },
  {
    type: 'graphic-organizer',"""

if "'concept-web'" not in content:
    content = content.replace("  {\n    type: 'graphic-organizer',", widget_entry)

with open('config/tools.ts', 'w') as f:
    f.write(content)

# Patch config/widgetDefaults.ts
with open('config/widgetDefaults.ts', 'r') as f:
    content = f.read()

if "ConceptWebConfig" not in content:
    content = content.replace("  GraphicOrganizerConfig,", "  GraphicOrganizerConfig,\n  ConceptWebConfig,")

widget_def = """  'concept-web': {
    w: 800,
    h: 600,
    config: {
      nodes: [],
      edges: [],
    } as ConceptWebConfig,
  },
  'graphic-organizer': {"""
if "'concept-web'" not in content:
    content = content.replace("  'graphic-organizer': {", widget_def)

with open('config/widgetDefaults.ts', 'w') as f:
    f.write(content)

# Patch config/widgetGradeLevels.ts
with open('config/widgetGradeLevels.ts', 'r') as f:
    content = f.read()

grade_entry = "  'graphic-organizer': ['k-2', '3-5', '6-8'],\n  'concept-web': ['k-2', '3-5', '6-8', '9-12'],"
if "'concept-web'" not in content:
    content = content.replace("  'graphic-organizer': ['k-2', '3-5', '6-8'],", grade_entry)

with open('config/widgetGradeLevels.ts', 'w') as f:
    f.write(content)

# Patch components/widgets/WidgetRegistry.ts
with open('components/widgets/WidgetRegistry.ts', 'r') as f:
    content = f.read()

reg_widget = """  'concept-web': lazyNamed(
    () => import('./ConceptWeb/Widget'),
    'ConceptWebWidget'
  ),
  'graphic-organizer': lazyNamed("""
if "'concept-web'" not in content:
    content = content.replace("  'graphic-organizer': lazyNamed(", reg_widget, 1)

reg_settings = """  'concept-web': lazyNamed(
    () => import('./ConceptWeb/Settings'),
    'ConceptWebSettings'
  ),
  'graphic-organizer': lazyNamed("""
if "import('./ConceptWeb/Settings')" not in content:
    content = content.replace("  'graphic-organizer': lazyNamed(", reg_settings)

reg_scaling = """  'concept-web': {
    baseWidth: 800,
    baseHeight: 600,
    canSpread: true,
    skipScaling: true,
    padding: 0,
  },
  'graphic-organizer': {"""
if "'concept-web': {" not in content:
    content = content.replace("  'graphic-organizer': {", reg_scaling)

with open('components/widgets/WidgetRegistry.ts', 'w') as f:
    f.write(content)

# Patch types.ts
with open('types.ts', 'r') as f:
    content = f.read()

if "'concept-web'" not in content:
    content = content.replace("  | 'graphic-organizer'", "  | 'graphic-organizer'\n  | 'concept-web'")

types_str = """export interface GraphicOrganizerConfig {
  templateType: 'frayer' | 't-chart' | 'venn' | 'kwl' | 'cause-effect';
  nodes: Record<string, OrganizerNode>;
  fontFamily?: GlobalFontFamily;
}

export interface ConceptNode {
  id: string;
  text: string;
  x: number;
  y: number;
  bgColor?: string;
}

export interface ConceptEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string; // e.g., "causes", "eats"
  lineStyle: 'solid' | 'dashed';
}

export interface ConceptWebConfig {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  fontFamily?: GlobalFontFamily;
}"""

if "ConceptWebConfig {" not in content:
    content = re.sub(r"export interface GraphicOrganizerConfig \{[\s\S]*?\}", types_str, content)

if "| ConceptWebConfig" not in content:
    content = content.replace("  | GraphicOrganizerConfig", "  | GraphicOrganizerConfig\n  | ConceptWebConfig")

if "? ConceptWebConfig" not in content:
    content = content.replace(
        "                                                                                    : T extends 'graphic-organizer'\n                                                                                      ? GraphicOrganizerConfig",
        "                                                                                    : T extends 'graphic-organizer'\n                                                                                      ? GraphicOrganizerConfig\n                                                                                        : T extends 'concept-web'\n                                                                                          ? ConceptWebConfig"
    )

with open('types.ts', 'w') as f:
    f.write(content)
