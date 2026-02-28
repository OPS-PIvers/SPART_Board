import re

with open("types.ts", "r") as f:
    content = f.read()

# Add BreathingConfig interface
config_interface = """
export interface PdfConfig {
"""
breathing_interface = """export interface BreathingConfig {
  pattern: '4-4-4-4' | '4-7-8' | '5-5';
  visual: 'circle' | 'lotus' | 'wave';
  color: string;
}

export interface PdfConfig {"""

content = content.replace(config_interface, breathing_interface)

# Add to WidgetConfig union
widget_config = "  | PdfConfig\n  | QuizConfig;"
widget_config_new = "  | PdfConfig\n  | QuizConfig\n  | BreathingConfig;"

content = content.replace(widget_config, widget_config_new)

# Add to ConfigForWidget
config_for = "  : T extends 'quiz'\n                                                                  ? QuizConfig\n                                                                  : never;"
config_for_new = "  : T extends 'quiz'\n                                                                  ? QuizConfig\n                                                                  : T extends 'breathing'\n                                                                    ? BreathingConfig\n                                                                    : never;"

content = content.replace(config_for, config_for_new)

with open("types.ts", "w") as f:
    f.write(content)
