import re

with open('components/widgets/ExpectationsWidget.tsx', 'r') as f:
    content = f.read()

# Fix main container
content = content.replace(
    "className={`h-full w-full bg-transparent p-3 gap-3 overflow-hidden animate-in fade-in duration-200 ${\n            isElementary ? 'grid grid-cols-2' : 'flex flex-col'\n          }`}",
    "className={`h-full w-full bg-transparent overflow-hidden animate-in fade-in duration-200 ${\n            isElementary ? 'grid grid-cols-2' : 'flex flex-col'\n          }`} style={{ padding: 'min(12px, 3cqmin)', gap: 'min(12px, 3cqmin)' }}"
)

# Fix Volume button
content = content.replace(
    "className={`flex-1 flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${\n              selectedVolume\n                ? `${selectedVolume.bg} border-current ${selectedVolume.color} shadow-sm`\n                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'\n            } ${isElementary ? 'col-span-2' : ''}`}",
    "className={`flex-1 flex items-center rounded-2xl border-2 transition-all group ${\n              selectedVolume\n                ? `${selectedVolume.bg} border-current ${selectedVolume.color} shadow-sm`\n                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'\n            } ${isElementary ? 'col-span-2' : ''}`} style={{ gap: 'min(16px, 4cqmin)', padding: 'min(16px, 4cqmin)' }}"
)

# Fix Groups button
content = content.replace(
    "className={`flex-1 flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${\n              selectedGroup\n                ? `${selectedGroup.bg} border-current ${selectedGroup.color} shadow-sm`\n                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'\n            }`}",
    "className={`flex-1 flex items-center rounded-2xl border-2 transition-all group ${\n              selectedGroup\n                ? `${selectedGroup.bg} border-current ${selectedGroup.color} shadow-sm`\n                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'\n            }`} style={{ gap: 'min(16px, 4cqmin)', padding: 'min(16px, 4cqmin)' }}"
)

# Fix Interaction button
content = content.replace(
    "className={`flex-1 flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${\n              selectedInteraction\n                ? `${selectedInteraction.bg} border-current ${selectedInteraction.color} shadow-sm`\n                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'\n            }`}",
    "className={`flex-1 flex items-center rounded-2xl border-2 transition-all group ${\n              selectedInteraction\n                ? `${selectedInteraction.bg} border-current ${selectedInteraction.color} shadow-sm`\n                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'\n            }`} style={{ gap: 'min(16px, 4cqmin)', padding: 'min(16px, 4cqmin)' }}"
)

with open('components/widgets/ExpectationsWidget.tsx', 'w') as f:
    f.write(content)
