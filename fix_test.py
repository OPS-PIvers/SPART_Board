import os

path = 'components/widgets/ScheduleWidget.test.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

# Filter out the solo import of ScheduleConfig
filtered_lines = [line for line in lines if line.strip() != "import { ScheduleConfig } from '../../types';"]

with open(path, 'w') as f:
    f.writelines(filtered_lines)
