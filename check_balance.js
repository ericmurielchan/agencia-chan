
const fs = require('fs');
const content = fs.readFileSync('components/Financials.tsx', 'utf8');
let balance = 0;
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        if (line[j] === '{') balance++;
        if (line[j] === '}') balance--;
        if (balance < 0) {
            console.log(`Balance became negative at line ${i + 1}, column ${j + 1}`);
            process.exit(0);
        }
    }
}
console.log(`Final balance: ${balance}`);
