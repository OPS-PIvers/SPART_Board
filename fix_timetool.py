import re

with open('components/widgets/TimeTool/TimeToolWidget.tsx', 'r') as f:
    content = f.read()

# Fix the sound picker button syntax error
pattern = r'className={`flex items-center rounded-full transition-all border shadow-sm ${\n\s+config\.theme === \'dark\'\n\s+\? \'bg-slate-800 border-slate-700 text-slate-400 hover:text-brand-blue-primary hover:bg-slate-700\'\n\s+: \'bg-slate-50 border-slate-100 text-slate-400 hover:text-brand-blue-primary hover:bg-slate-100\'\n\s+}\n\s+style={{ gap: "min\(6px, 1.5cqmin\)", padding: "min\(6px, 1.5cqmin\) min\(12px, 3cqmin\)" }}`}'
replacement = "className={`flex items-center rounded-full transition-all border shadow-sm ${\n                  config.theme === 'dark'\n                    ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-brand-blue-primary hover:bg-slate-700'\n                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-brand-blue-primary hover:bg-slate-100'\n                }`} style={{ gap: 'min(6px, 1.5cqmin)', padding: 'min(6px, 1.5cqmin) min(12px, 3cqmin)' }}"

content = re.sub(pattern, replacement, content)

with open('components/widgets/TimeTool/TimeToolWidget.tsx', 'w') as f:
    f.write(content)
