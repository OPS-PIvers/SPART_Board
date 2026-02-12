import re

with open('components/widgets/MiniAppWidget.tsx', 'r') as f:
    content = f.read()

# Replace the content prop of WidgetLayout in MiniAppLibrary
pattern = r'content={\s+<div className="flex-1 w-full h-full overflow-y-auto bg-transparent custom-scrollbar flex flex-col" style={{ padding: "min\(16px, 4cqmin\)", gap: "min\(8px, 2cqmin\)" }}>.*?</div>\s+}'
replacement = """content={
        <div className="flex-1 w-full h-full overflow-y-auto bg-transparent custom-scrollbar flex flex-col" style={{ padding: "min(16px, 4cqmin)", gap: "min(8px, 2cqmin)" }}>
          {library.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-40"
              style={{ gap: "min(16px, 4cqmin)", padding: "min(48px, 10cqmin) 0" }}
            >
              <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <Box className="w-10 h-10 stroke-slate-300" />
              </div>
              <div className="text-center">
                <p
                  className="font-black uppercase tracking-widest"
                  style={{
                    fontSize: 'min(14px, 3.5cqmin)',
                    marginBottom: 'min(4px, 1cqmin)',
                  }}
                >
                  No apps saved yet
                </p>
                <p
                  className="font-bold uppercase tracking-tighter"
                  style={{ fontSize: 'min(12px, 3cqmin)' }}
                >
                  Import a file or create your first mini-app.
                </p>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={library.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {library.map((app) => (
                  <SortableItem
                    key={app.id}
                    app={app}
                    onRun={handleRun}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      }"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('components/widgets/MiniAppWidget.tsx', 'w') as f:
    f.write(content)
