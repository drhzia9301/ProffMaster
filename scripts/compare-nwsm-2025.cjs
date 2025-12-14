/**
 * Parse JSON source file and compare with NWSM preproffs
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

function normalizeText(text) {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 50);
}

function main() {
    console.log("=".repeat(70));
    console.log("NWSM 2025 SOURCE COMPARISON (JSON)");
    console.log("=".repeat(70));
    
    // Load and parse source JSON
    const sourcePath = path.join(__dirname, '..', 'new', '2025_nwsm_m1+m2.txt');
    const sourceContent = fs.readFileSync(sourcePath, 'utf8');
    
    let sourceQuestions = [];
    try {
        const parsed = JSON.parse(sourceContent);
        if (Array.isArray(parsed)) {
            sourceQuestions = parsed.map(q => q.question || q.text || '').filter(q => q.length > 0);
        }
    } catch (e) {
        // Try to extract questions using regex
        const matches = sourceContent.match(/"question":\s*"([^"]+)"/g);
        if (matches) {
            sourceQuestions = matches.map(m => {
                const match = m.match(/"question":\s*"([^"]+)"/);
                return match ? match[1] : '';
            }).filter(q => q.length > 0);
        }
    }
    
    console.log(`\nSource file: ${sourceQuestions.length} questions`);
    
    // Load current NWSM M1 and M2
    const m1Path = path.join(__dirname, '..', 'public', 'qbanks', 'nwsm M1.enc');
    const m2Path = path.join(__dirname, '..', 'public', 'qbanks', 'nwsm M2.enc');
    
    const m1Content = decrypt(fs.readFileSync(m1Path));
    const m2Content = decrypt(fs.readFileSync(m2Path));
    
    // Extract questions
    const m1Statements = m1Content.split(/INSERT INTO preproff|INSERT OR REPLACE INTO preproff/).slice(1);
    const m2Statements = m2Content.split(/INSERT INTO preproff|INSERT OR REPLACE INTO preproff/).slice(1);
    
    const m1Questions = m1Statements.map(s => {
        const match = s.match(/VALUES\s*\(\s*'([^']+)'/);
        return match ? match[1] : '';
    }).filter(q => q.length > 0);
    
    const m2Questions = m2Statements.map(s => {
        const match = s.match(/VALUES\s*\(\s*'([^']+)'/);
        return match ? match[1] : '';
    }).filter(q => q.length > 0);
    
    console.log(`Current NWSM M1: ${m1Questions.length} questions`);
    console.log(`Current NWSM M2: ${m2Questions.length} questions`);
    console.log(`Current total: ${m1Questions.length + m2Questions.length} questions`);
    
    // Normalize for comparison
    const currentNormalized = new Set([
        ...m1Questions.map(normalizeText),
        ...m2Questions.map(normalizeText)
    ]);
    
    // Compare
    const missing = [];
    const found = [];
    
    for (const srcQ of sourceQuestions) {
        const normalized = normalizeText(srcQ);
        let isFound = false;
        
        for (const current of currentNormalized) {
            if (normalized.substring(0, 35) === current.substring(0, 35)) {
                isFound = true;
                break;
            }
        }
        
        if (isFound) {
            found.push(srcQ);
        } else {
            missing.push(srcQ);
        }
    }
    
    console.log(`\n${"=".repeat(70)}`);
    console.log("RESULTS");
    console.log("=".repeat(70));
    console.log(`Matched: ${found.length} / ${sourceQuestions.length}`);
    console.log(`Missing: ${missing.length}`);
    
    if (missing.length > 0) {
        console.log(`\nMISSING QUESTIONS:`);
        missing.slice(0, 20).forEach((q, i) => {
            console.log(`\n${i+1}. ${q.substring(0, 80)}...`);
        });
        
        if (missing.length > 20) {
            console.log(`\n... and ${missing.length - 20} more`);
        }
        
        fs.writeFileSync(
            path.join(__dirname, 'nwsm-missing.txt'),
            missing.map((q, i) => `${i+1}. ${q}`).join('\n\n')
        );
        console.log(`\n✅ Saved to scripts/nwsm-missing.txt`);
    } else {
        console.log("\n✅ ALL SOURCE QUESTIONS ARE PRESENT IN PREPROFFS!");
    }
}

main();
