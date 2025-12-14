/**
 * Add missing 2024 data for GMC J and WMC J
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

function addQuestionsToFile(sourcePath, targetPath, college, block, year) {
    console.log(`\n=== Adding ${college} ${block} ${year} ===`);
    
    // Load source
    const sourceContent = fs.readFileSync(sourcePath, 'utf8');
    const questions = JSON.parse(sourceContent);
    console.log(`  Source: ${questions.length} questions`);
    
    // Load target
    const encBuffer = fs.readFileSync(targetPath);
    let content = decrypt(encBuffer);
    
    const beforeCount = (content.match(/INSERT INTO preproff/gi) || []).length;
    console.log(`  Current: ${beforeCount} questions`);
    
    // Add questions
    let inserts = '';
    for (const q of questions) {
        const text = escapeSQL(q.question || '');
        const options = JSON.stringify(q.options || []).replace(/'/g, "''");
        const correctIdx = getCorrectIndexFromAnswer(q.answer, q.options);
        const explanation = escapeSQL(q.explanation || '');
        const subject = escapeSQL(q.subject || '');
        const topic = escapeSQL(q.topic || '');
        
        inserts += `INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('${text}', '${options}', ${correctIdx}, '${explanation}', '${subject}', '${topic}', 'Medium', '${block}', '${college}', '${year}');\n`;
    }
    
    content = content.trim() + '\n' + inserts;
    
    const afterCount = (content.match(/INSERT INTO preproff/gi) || []).length;
    console.log(`  New total: ${afterCount} questions (+${afterCount - beforeCount})`);
    
    // Save
    fs.copyFileSync(targetPath, targetPath + '.backup8');
    fs.writeFileSync(targetPath, encrypt(content));
    console.log(`  ✅ Saved`);
    
    return afterCount;
}

function main() {
    console.log("=".repeat(70));
    console.log("ADDING MISSING 2024 PREPROFF DATA");
    console.log("=".repeat(70));
    
    const newDir = path.join(__dirname, '..', 'new');
    const qbanksDir = path.join(__dirname, '..', 'public', 'qbanks');
    
    // 1. GMC J 2024
    const gmcJTotal = addQuestionsToFile(
        path.join(newDir, '2.BLOCK J GMC 2024.txt'),
        path.join(qbanksDir, 'gmc J.enc'),
        'GMC',
        'J',
        '2024'
    );
    
    // 2. WMC J 2024
    const wmcJTotal = addQuestionsToFile(
        path.join(newDir, '9.BLOCK J WMC 2024.txt'),
        path.join(qbanksDir, 'wmc J.enc'),
        'WMC',
        'J',
        '2024'
    );
    
    console.log("\n" + "=".repeat(70));
    console.log("SUMMARY");
    console.log("=".repeat(70));
    console.log(`GMC J: ${gmcJTotal} total questions`);
    console.log(`WMC J: ${wmcJTotal} total questions`);
    console.log("\nNote: WMC L 2025 source file not found in new folder");
}

main();
