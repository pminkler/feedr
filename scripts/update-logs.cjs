// Script to replace console.log with debugLog in e2e test files
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../e2e/recipe-edit.spec.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all console.log statements with debugLog
content = content.replace(/console\.log\(/g, 'debugLog(');

fs.writeFileSync(filePath, content);
console.log('Updated recipe-edit.spec.ts - replaced console.log with debugLog');