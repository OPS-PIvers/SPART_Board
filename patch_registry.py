with open("components/widgets/WidgetRegistry.ts", "r") as f:
    content = f.read()

# WIDGET_COMPONENTS
quiz_comp = "  quiz: lazyNamed(() => import('./QuizWidget'), 'QuizWidget'),"
breathing_comp = "  quiz: lazyNamed(() => import('./QuizWidget'), 'QuizWidget'),\n  breathing: lazyNamed(() => import('./Breathing/BreathingWidget'), 'BreathingWidget'),"
content = content.replace(quiz_comp, breathing_comp)

# WIDGET_SETTINGS_COMPONENTS
quiz_setting = "  quiz: lazyNamed(() => import('./QuizWidget'), 'QuizWidgetSettings'),"
breathing_setting = "  quiz: lazyNamed(() => import('./QuizWidget'), 'QuizWidgetSettings'),\n  breathing: lazyNamed(() => import('./Breathing/BreathingSettings'), 'BreathingSettings'),"
content = content.replace(quiz_setting, breathing_setting)

# WIDGET_SCALING_CONFIG
quiz_scaling = """  quiz: {
    baseWidth: 620,
    baseHeight: 560,
    canSpread: true,
    skipScaling: true,
    padding: 0,
  },"""
breathing_scaling = """  quiz: {
    baseWidth: 620,
    baseHeight: 560,
    canSpread: true,
    skipScaling: true,
    padding: 0,
  },
  breathing: {
    baseWidth: 400,
    baseHeight: 400,
    canSpread: true,
    skipScaling: true,
    padding: 0,
  },"""
content = content.replace(quiz_scaling, breathing_scaling)

with open("components/widgets/WidgetRegistry.ts", "w") as f:
    f.write(content)
