/**
 * Fix KMC M1 - Replace 2025 questions with the full 56 from old version
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
    console.log("=== Fix KMC M1 - Restore Full 2025 Questions ===\n");
    
    // Step 1: Get the old version questions (56 questions)
    console.log("Step 1: Reading old version from git...");
    const { execSync } = require('child_process');
    
    // Get the old version from git
    const oldContent = execSync('git show 7b65f60:"public/qbanks/kmc M1.enc"', { encoding: 'buffer' });
    const oldDecrypted = decrypt(oldContent);
    const oldQuestions = JSON.parse(oldDecrypted);
    
    console.log(`  Found ${oldQuestions.length} questions in old version`);
    
    // Step 2: Read current file
    console.log("\nStep 2: Reading current KMC M1...");
    const currentPath = path.join(__dirname, '..', 'public', 'qbanks', 'kmc M1.enc');
    const currentBuffer = fs.readFileSync(currentPath);
    let currentContent = decrypt(currentBuffer);
    
    // Count current 2025 questions
    const current2025Count = (currentContent.match(/'2025'/g) || []).length;
    const current2023Count = (currentContent.match(/'2023'/g) || []).length;
    console.log(`  Current: ${current2023Count} from 2023, ${current2025Count} from 2025`);
    
    // Step 3: Remove existing 2025 questions from SQL
    console.log("\nStep 3: Removing existing 2025 questions...");
    
    // Match and remove INSERT statements with '2025' year
    const insertPattern = /INSERT INTO preproff \([^)]+\) VALUES \([^;]+, '2025'\);?\n?/g;
    const before = currentContent;
    currentContent = currentContent.replace(insertPattern, '');
    
    const removed = (before.match(insertPattern) || []).length;
    console.log(`  Removed ${removed} 2025 INSERT statements`);
    
    // Step 4: Convert old JSON questions to SQL and add them
    console.log("\nStep 4: Adding 56 questions from old version as 2025...");
    
    let newInserts = '';
    for (const q of oldQuestions) {
        const text = escapeSQL(q.question || '');
        const options = JSON.stringify(q.options || []).replace(/'/g, "''");
        const correctIdx = getCorrectIndexFromAnswer(q.answer, q.options);
        const explanation = escapeSQL(q.explanation || '');
        const subject = escapeSQL(q.subject || '');
        const topic = escapeSQL(q.topic || '');
        const difficulty = 'Medium';
        const block = 'M1';
        const college = 'KMC';
        const year = '2025';
        
        newInserts += `INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('${text}', '${options}', ${correctIdx}, '${explanation}', '${subject}', '${topic}', '${difficulty}', '${block}', '${college}', '${year}');\n`;
    }
    
    // Add new inserts to content
    currentContent = currentContent.trim() + '\n' + newInserts;
    
    // Step 5: Verify counts
    const new2025Count = (currentContent.match(/'2025'/g) || []).length;
    const new2023Count = (currentContent.match(/'2023'/g) || []).length;
    console.log(`  New counts: ${new2023Count} from 2023, ${new2025Count} from 2025`);
    
    // Step 6: Save
    console.log("\nStep 5: Saving...");
    
    // Backup current
    fs.copyFileSync(currentPath, currentPath + '.backup3');
    console.log("  Created backup: kmc M1.enc.backup3");
    
    // Save new content
    const encrypted = encrypt(currentContent);
    fs.writeFileSync(currentPath, encrypted);
    console.log("  Saved updated kmc M1.enc");
    
    console.log("\n=== Done! ===");
    console.log(`KMC M1 now has ${new2023Count + new2025Count} total questions`);
    console.log(`  2023: ${new2023Count}`);
    console.log(`  2025: ${new2025Count}`);
}

main();
