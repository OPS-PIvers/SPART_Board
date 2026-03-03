import os

def fix_settings():
    path = 'components/widgets/Schedule/Settings.tsx'
    with open(path, 'r') as f:
        content = f.read()

    # Fix useEffect dependency warning and Logical expression warning
    # Use useMemo for schedules
    old_schedules_init = '  const schedules = config.schedules ?? [];'
    new_schedules_init = '  const schedules = React.useMemo(() => config.schedules ?? [], [config.schedules]);'
    content = content.replace(old_schedules_init, new_schedules_init)

    # Fix missing 'config' dependency in migration useEffect
    old_migration_effect = '''  React.useEffect(() => {
    if (!config.schedules && config.items?.length > 0) {
      updateWidget(widget.id, {
        config: {
          ...config,
          schedules: [
            {
              id: crypto.randomUUID(),
              name: 'Default',
              items: config.items,
              days: [1, 2, 3, 4, 5],
            },
          ],
        } as ScheduleConfig,
      });
    }
  }, [config.items, config.schedules, updateWidget, widget.id]);'''

    new_migration_effect = '''  React.useEffect(() => {
    if (!config.schedules && config.items && config.items.length > 0) {
      updateWidget(widget.id, {
        config: {
          ...config,
          schedules: [
            {
              id: crypto.randomUUID(),
              name: 'Default',
              items: config.items,
              days: [1, 2, 3, 4, 5],
            },
          ],
        } as ScheduleConfig,
      });
    }
  }, [config, updateWidget, widget.id]);'''
    content = content.replace(old_migration_effect, new_migration_effect)

    with open(path, 'w') as f:
        f.write(content)

fix_settings()
