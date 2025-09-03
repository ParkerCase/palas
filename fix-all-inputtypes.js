const fs = require('fs');

// Read the checklist data file
const filePath = 'lib/checklist-data.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Find all checklist items that are missing inputType
const lines = content.split('\n');
let updatedLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if this is a field line that doesn't have inputType on the next line
  if (line.includes('field:') && !line.includes('inputType:') && !line.includes('placeholder:') && !line.includes('required:')) {
    // Look ahead to see if the next line is a closing brace
    if (i + 1 < lines.length && lines[i + 1].trim() === '},') {
      // Add inputType: 'boolean' before the closing brace
      updatedLines.push(line);
      updatedLines.push('    inputType: \'boolean\'');
      updatedLines.push(lines[i + 1]);
      i++; // Skip the next line since we've already added it
      continue;
    }
  }
  
  updatedLines.push(line);
}

// Write the updated content back
fs.writeFileSync(filePath, updatedLines.join('\n'));
console.log('Fixed all missing inputType properties in checklist data');
