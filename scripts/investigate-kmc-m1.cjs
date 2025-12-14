/**
 * Investigate: Search for KMC M1 questions across all preproff files
 * to find if any were accidentally moved to other papers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025";

function decrypt(encryptedBuffer) {
    const keyBytes = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    const decryptedBytes = Buffer.alloc(encryptedBuffer.length);
    for (let i = 0; i < encryptedBuffer.length; i++) {
        decryptedBytes[i] = encryptedBuffer[i] ^ keyBytes[i % keyBytes.length];
    }
    return decryptedBytes.toString('utf-8');
}

function extractQuestionTexts(content) {
    const texts = [];
    
    // Try JSON
    try {
        const j = JSON.parse(content);
        const items = Array.isArray(j) ? j.flat() : [j];
        for (const q of items) {
            if (q.question) texts.push(q.question.substring(0, 100).toLowerCase());
        }
        return texts;
    } catch(e) {}
    
    // Try SQL
    const regex = /VALUES \('([^']+)'/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
        texts.push(m[1].substring(0, 100).toLowerCase());
    }
    return texts;
}

function main() {
    console.log("=== Investigating Missing KMC M1 Questions ===\n");
    
    // Step 1: Get old KMC M1 questions
    console.log("Step 1: Loading old KMC M1 questions from commit 7b65f60...");
    const oldContent = execSync('git show 7b65f60:"public/qbanks/kmc M1.enc"', { encoding: 'buffer' });
    const oldDecrypted = decrypt(oldContent);
    const oldQuestions = JSON.parse(oldDecrypted);
    console.log(`  Found ${oldQuestions.length} questions`);
    
    const oldTexts = oldQuestions.map(q => q.question.substring(0, 100).toLowerCase());
    
    // Step 2: Scan all preproff files
    console.log("\nStep 2: Scanning all preproff files...\n");
    const qbanksDir = path.join(__dirname, '..', 'public', 'qbanks');
    const files = fs.readdirSync(qbanksDir).filter(f => f.endsWith('.enc') && !f.includes('backup'));
    
    const foundIn = {};
    
    for (const file of files) {
        if (file === 'kmc M1.enc') continue; // Skip KMC M1 itself
        
        const filePath = path.join(qbanksDir, file);
        const encrypted = fs.readFileSync(filePath);
        const content = decrypt(encrypted);
        const texts = extractQuestionTexts(content);
        
        let matchCount = 0;
        for (const oldText of oldTexts) {
            if (texts.some(t => t.includes(oldText.substring(0, 50)) || oldText.includes(t.substring(0, 50)))) {
                matchCount++;
                if (!foundIn[file]) foundIn[file] = [];
                foundIn[file].push(oldText.substring(0, 60) + '...');
            }
        }
        
        if (matchCount > 0) {
            console.log(`  ${file}: ${matchCount} potential matches`);
        }
    }
    
    // Step 3: Report findings
    console.log("\n=== RESULTS ===\n");
    
    if (Object.keys(foundIn).length === 0) {
        console.log("No KMC M1 questions found in other preproff files.");
        console.log("The questions were likely not duplicated elsewhere.");
    } else {
        console.log("KMC M1 questions found in other files:\n");
        for (const [file, questions] of Object.entries(foundIn)) {
            console.log(`📂 ${file}:`);
            questions.slice(0, 5).forEach(q => console.log(`   - ${q}`));
            if (questions.length > 5) {
                console.log(`   ... and ${questions.length - 5} more`);
            }
            console.log('');
        }
    }
}

main();
