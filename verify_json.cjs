const fs = require('fs');
const path = require('path');

const dir = 'public/qbanks';
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('.txt')) {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        try {
            JSON.parse(content);
            console.log(`✓ ${file} is valid JSON`);
        } catch (e) {
            console.error(`❌ ${file} has JSON error:`, e.message);
        }
    }
});
