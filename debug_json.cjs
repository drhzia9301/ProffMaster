const fs = require('fs');
const path = require('path');

const filePath = 'public/qbanks/kmc M1.txt';
const content = fs.readFileSync(filePath, 'utf8');

let openCount = 0;
let closeCount = 0;
let openIndices = [];
let closeIndices = [];

for (let i = 0; i < content.length; i++) {
    if (content[i] === '[') {
        openCount++;
        openIndices.push(i);
    } else if (content[i] === ']') {
        closeCount++;
        closeIndices.push(i);
    }
}

console.log(`Open brackets: ${openCount}`);
console.log(`Close brackets: ${closeCount}`);
console.log('Open indices:', openIndices);
console.log('Close indices:', closeIndices);
