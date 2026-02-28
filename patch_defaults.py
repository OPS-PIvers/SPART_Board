import re

with open("config/widgetDefaults.ts", "r") as f:
    content = f.read()

quiz_default = """  quiz: {
    w: 620,
    h: 560,
    config: {
      view: 'manager',
      selectedQuizId: null,
      selectedQuizTitle: null,
      activeLiveSessionCode: null,
      resultsSessionId: null,
    },
  },
};"""

breathing_default = """  quiz: {
    w: 620,
    h: 560,
    config: {
      view: 'manager',
      selectedQuizId: null,
      selectedQuizTitle: null,
      activeLiveSessionCode: null,
      resultsSessionId: null,
    },
  },
  breathing: {
    w: 400,
    h: 400,
    config: {
      pattern: '4-4-4-4',
      visual: 'circle',
      color: '#3b82f6',
    },
  },
};"""

content = content.replace(quiz_default, breathing_default)

with open("config/widgetDefaults.ts", "w") as f:
    f.write(content)
