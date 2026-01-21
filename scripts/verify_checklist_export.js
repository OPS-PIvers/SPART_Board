// Mock Data
const manualConfig = {
  mode: 'manual',
  items: [
    { id: '1', text: 'Task 1', completed: true },
    { id: '2', text: 'Task 2', completed: false },
  ],
};

const rosterConfig = {
  mode: 'roster',
  items: [],
  rosterMode: 'custom',
  firstNames: 'John\nJane',
  lastNames: 'Doe\nSmith',
  completedNames: ['John Doe'], // ID is the name in this simple mock
};

// Simulation of the Export Logic
function generateCSV(config, students = []) {
  let csvHeader = '';
  let csvRows = '';

  if (config.mode === 'manual') {
    csvHeader = 'Task,Completed\n';
    csvRows = config.items
      .map(
        (i) => `"${i.text.replace(/"/g, '""')}",${i.completed ? 'Yes' : 'No'}`
      )
      .join('\n');
  } else {
    csvHeader = 'Student Name,Completed\n';
    // In real app, 'students' is passed in because it's calculated from hooks/props
    const names = students;
    csvRows = names
      .map((name) => {
        const isCompleted = config.completedNames?.includes(name);
        return `"${name.replace(/"/g, '""')}",${isCompleted ? 'Yes' : 'No'}`;
      })
      .join('\n');
  }

  return csvHeader + csvRows;
}

// Test Run
console.log('--- Manual Mode Export ---');
console.log(generateCSV(manualConfig));

console.log('\n--- Roster Mode Export ---');
// Simulating the useMemo logic for students
const students = ['John Doe', 'Jane Smith'];
console.log(generateCSV(rosterConfig, students));
