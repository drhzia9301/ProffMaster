/**
 * 1. Add KGMC M2 2024 questions
 * 2. Remove weird question from WMC M2
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
    console.log("=== Fix KGMC M2 2024 & Remove WMC M2 Weird Question ===\n");
    
    // Part 1: Add KGMC M2 2024 questions
    console.log("Part 1: Adding KGMC M2 2024 questions...");
    const kgmcSourcePath = path.join(__dirname, '..', 'new', '4.BLOCK M2 KGMC 2024.txt');
    const kgmcSource = JSON.parse(fs.readFileSync(kgmcSourcePath, 'utf8'));
    console.log(`  Found ${kgmcSource.length} questions in source`);
    
    const kgmcPath = path.join(__dirname, '..', 'public', 'qbanks', 'kgmc M2.enc');
    const kgmcBuffer = fs.readFileSync(kgmcPath);
    let kgmcContent = decrypt(kgmcBuffer);
    
    const kgmcBefore2023 = (kgmcContent.match(/'2023'/g) || []).length;
    const kgmcBefore2024 = (kgmcContent.match(/'2024'/g) || []).length;
    console.log(`  Current: 2023=${kgmcBefore2023}, 2024=${kgmcBefore2024}`);
    
    // Add 2024 questions
    let kgmcInserts = '';
    for (const q of kgmcSource) {
        const text = escapeSQL(q.question || '');
        const options = JSON.stringify(q.options || []).replace(/'/g, "''");
        const correctIdx = getCorrectIndexFromAnswer(q.answer, q.options);
        const explanation = escapeSQL(q.explanation || '');
        const subject = escapeSQL(q.subject || '');
        const topic = escapeSQL(q.topic || '');
        
        kgmcInserts += `INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('${text}', '${options}', ${correctIdx}, '${explanation}', '${subject}', '${topic}', 'Medium', 'M2', 'KGMC', '2024');\n`;
    }
    
    kgmcContent = kgmcContent.trim() + '\n' + kgmcInserts;
    
    const kgmcAfter2023 = (kgmcContent.match(/'2023'/g) || []).length;
    const kgmcAfter2024 = (kgmcContent.match(/'2024'/g) || []).length;
    console.log(`  New counts: 2023=${kgmcAfter2023}, 2024=${kgmcAfter2024}`);
    
    // Save KGMC M2
    fs.copyFileSync(kgmcPath, kgmcPath + '.backup6');
    fs.writeFileSync(kgmcPath, encrypt(kgmcContent));
    console.log(`  ✅ Saved KGMC M2 (${kgmcAfter2023 + kgmcAfter2024} total questions)\n`);
    
    // Part 2: Remove weird question from WMC M2
    console.log("Part 2: Removing weird question from WMC M2...");
    const wmcPath = path.join(__dirname, '..', 'public', 'qbanks', 'wmc M2.enc');
    const wmcBuffer = fs.readFileSync(wmcPath);
    let wmcContent = decrypt(wmcBuffer);
    
    // Find and remove the weird question with "WNP8aPAPER SOLVE IT PREPROFFS"
    const weirdPattern = /INSERT INTO preproff[^;]*WNP8aPAPER SOLVE IT PREPROFFS[^;]*;/gi;
    const beforeCount = (wmcContent.match(/INSERT INTO preproff/gi) || []).length;
    
    wmcContent = wmcContent.replace(weirdPattern, '');
    
    const afterCount = (wmcContent.match(/INSERT INTO preproff/gi) || []).length;
    const removed = beforeCount - afterCount;
    
    console.log(`  Before: ${beforeCount} questions`);
    console.log(`  After: ${afterCount} questions`);
    console.log(`  Removed: ${removed} weird question(s)`);
    
    // Save WMC M2
    fs.copyFileSync(wmcPath, wmcPath + '.backup6');
    fs.writeFileSync(wmcPath, encrypt(wmcContent));
    console.log(`  ✅ Saved WMC M2\n`);
    
    console.log("=== Done! ===");
    console.log(`KGMC M2: ${kgmcAfter2023 + kgmcAfter2024} questions (${kgmcAfter2023} from 2023, ${kgmcAfter2024} from 2024)`);
    console.log(`WMC M2: ${afterCount} questions (removed ${removed} weird question)`);
}

main();
