/**
 * Check for duplicate questions across all preproff files
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

function extractQuestions(content, filename) {
    const questions = [];
    
    // Try JSON
    try {
        const j = JSON.parse(content);
        const items = Array.isArray(j) ? j.flat() : [j];
        for (const q of items) {
            if (q.question) {
                questions.push({
                    text: q.question.trim().toLowerCase().substring(0, 150),
                    full: q.question,
                    file: filename
                });
            }
        }
        return questions;
    } catch(e) {}
    
    // Try SQL - extract question text from INSERT VALUES
    const regex = /VALUES \('([^']+)'/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
        questions.push({
            text: m[1].trim().toLowerCase().substring(0, 150),
            full: m[1],
            file: filename
        });
    }
    return questions;
}

function main() {
    console.log("=".repeat(70));
    console.log("DUPLICATE QUESTION CHECK");
    console.log("=".repeat(70));
    console.log("");
    
    const qbanksDir = path.join(__dirname, '..', 'public', 'qbanks');
    const files = fs.readdirSync(qbanksDir).filter(f => f.endsWith('.enc') && !f.includes('backup'));
    
    // Collect all questions
    const allQuestions = [];
    const fileStats = {};
    
    for (const file of files) {
        const filePath = path.join(qbanksDir, file);
        const encrypted = fs.readFileSync(filePath);
        const content = decrypt(encrypted);
        const questions = extractQuestions(content, file);
        allQuestions.push(...questions);
        fileStats[file] = questions.length;
    }
    
    console.log(`Total questions across all files: ${allQuestions.length}\n`);
    
    // Find duplicates
    const seen = new Map();
    const duplicates = [];
    
    for (const q of allQuestions) {
        const key = q.text.substring(0, 80); // First 80 chars as key
        if (seen.has(key)) {
            const original = seen.get(key);
            // Only count as duplicate if in different files
            if (original.file !== q.file) {
                duplicates.push({
                    text: q.full.substring(0, 100) + '...',
                    files: [original.file, q.file]
                });
            }
        } else {
            seen.set(key, q);
        }
    }
    
    // Report
    console.log("=".repeat(70));
    console.log("RESULTS");
    console.log("=".repeat(70));
    
    if (duplicates.length === 0) {
        console.log("\n✅ No duplicate questions found across different preproff files!\n");
    } else {
        console.log(`\n⚠️ Found ${duplicates.length} potential duplicates across files:\n`);
        
        // Group by file pairs
        const byFiles = {};
        for (const d of duplicates) {
            const key = d.files.sort().join(' <-> ');
            if (!byFiles[key]) byFiles[key] = [];
            byFiles[key].push(d.text);
        }
        
        for (const [filePair, texts] of Object.entries(byFiles)) {
            console.log(`📂 ${filePair}: ${texts.length} duplicates`);
            texts.slice(0, 3).forEach(t => console.log(`   - ${t.substring(0, 70)}...`));
            if (texts.length > 3) console.log(`   ... and ${texts.length - 3} more`);
            console.log('');
        }
    }
    
    // Summary stats
    console.log("=".repeat(70));
    console.log("FILE SUMMARY");
    console.log("=".repeat(70));
    
    let total = 0;
    for (const [file, count] of Object.entries(fileStats).sort()) {
        console.log(`  ${file.padEnd(20)} ${count.toString().padStart(4)} questions`);
        total += count;
    }
    console.log(`\n  TOTAL: ${total} questions`);
}

main();
