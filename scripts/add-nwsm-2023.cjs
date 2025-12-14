/**
 * Add NWSM M1 2023 questions from source file
 */

const fs = require('fs');
const path = require('path');

const ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025";

function decrypt(encryptedBuffer) {
    const keyBytes = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    const decryptedBytes = Buffer.alloc(encryptedBuffer.length);
    for (let i = 0; i < encryptedBuffer.length; i++) {
        decryptedBytes[i] = encryptedBuffer[i] ^ keyBytes[i % keyBytes.length];
    }
    return decryptedBytes.toString('utf-8');
}

function encrypt(plainText) {
    const plainBytes = Buffer.from(plainText, 'utf-8');
    const keyBytes = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    const encryptedBytes = Buffer.alloc(plainBytes.length);
    for (let i = 0; i < plainBytes.length; i++) {
        encryptedBytes[i] = plainBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return encryptedBytes;
}

function escapeSQL(str) {
    if (!str) return '';
    return str.replace(/'/g, "''");
}

function getCorrectIndexFromAnswer(answer, options) {
    if (typeof answer === 'string' && answer.length === 1) {
        return answer.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
    }
    return 0;
}

function main() {
    console.log("=== Adding NWSM M1 2023 Questions ===\n");
    
    // Step 1: Load 2023 questions from source
    console.log("Step 1: Loading 2023 NWSM M1 questions...");
    const sourcePath = path.join(__dirname, '..', 'new', '7. BLOCK ENT NWSM 2023 TMM US.txt');
    const sourceContent = fs.readFileSync(sourcePath, 'utf8');
    const questions2023 = JSON.parse(sourceContent);
    console.log(`  Found ${questions2023.length} questions`);
    
    // Step 2: Load current NWSM M1
    console.log("\nStep 2: Loading current NWSM M1...");
    const nwsmPath = path.join(__dirname, '..', 'public', 'qbanks', 'nwsm M1.enc');
    const encBuffer = fs.readFileSync(nwsmPath);
    let content = decrypt(encBuffer);
    
    const current2023 = (content.match(/'2023'/g) || []).length;
    const current2025 = (content.match(/'2025'/g) || []).length;
    console.log(`  Current: 2023=${current2023}, 2025=${current2025}`);
    
    // Step 3: Convert 2023 questions to SQL and add
    console.log("\nStep 3: Adding 2023 questions...");
    
    let newInserts = '';
    for (const q of questions2023) {
        const text = escapeSQL(q.question || '');
        const options = JSON.stringify(q.options || []).replace(/'/g, "''");
        const correctIdx = getCorrectIndexFromAnswer(q.answer, q.options);
        const explanation = escapeSQL(q.explanation || '');
        const subject = escapeSQL(q.subject || '');
        const topic = escapeSQL(q.topic || '');
        const difficulty = 'Medium';
        const block = 'M1';
        const college = 'NWSM';
        const year = '2023';
        
        newInserts += `INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('${text}', '${options}', ${correctIdx}, '${explanation}', '${subject}', '${topic}', '${difficulty}', '${block}', '${college}', '${year}');\n`;
    }
    
    content = content.trim() + '\n' + newInserts;
    
    // Step 4: Verify and save
    const new2023 = (content.match(/'2023'/g) || []).length;
    const new2025 = (content.match(/'2025'/g) || []).length;
    console.log(`  New counts: 2023=${new2023}, 2025=${new2025}`);
    console.log(`  Total: ${new2023 + new2025} questions`);
    
    // Create backup
    fs.copyFileSync(nwsmPath, nwsmPath + '.backup5');
    console.log("\nCreated backup: nwsm M1.enc.backup5");
    
    // Save
    const encrypted = encrypt(content);
    fs.writeFileSync(nwsmPath, encrypted);
    console.log("Saved updated nwsm M1.enc");
    
    console.log("\n=== Done! ===");
}

main();
