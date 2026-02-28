with open("config/widgetGradeLevels.ts", "r") as f:
    content = f.read()

quiz_grade = "  quiz: ALL_GRADE_LEVELS,"
breathing_grade = "  quiz: ALL_GRADE_LEVELS,\n  breathing: ALL_GRADE_LEVELS,"

content = content.replace(quiz_grade, breathing_grade)

with open("config/widgetGradeLevels.ts", "w") as f:
    f.write(content)
