/**
 * Auto-fix common issues in initial_db.enc
 * - Spelling corrections
 * - Multiple spaces
 * - Common fixes
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

// Spelling fixes (word boundary aware)
const SPELLING_FIXES = [
    // Medical compound words
    [/\bTri cyclic anti depressive\b/gi, 'Tricyclic antidepressants'],
    [/\bTri cyclic\b/gi, 'Tricyclic'],
    [/\banti depressive\b/gi, 'antidepressant'],
    [/\banti-depressants\b/gi, 'antidepressants'],
    [/\banti depressant\b/gi, 'antidepressant'],
    
    // Arrhythmia
    [/\barrythmia\b/gi, 'arrhythmia'],
    [/\barrhythmia\b/gi, 'arrhythmia'],
    
    // Common typos
    [/\bteh\b/g, 'the'],
    [/\bTeh\b/g, 'The'],
    [/\badn\b/g, 'and'],
    [/\bwhcih\b/g, 'which'],
    [/\bthier\b/g, 'their'],
    [/\brecieve\b/g, 'receive'],
    [/\boccured\b/g, 'occurred'],
    [/\boccuring\b/g, 'occurring'],
    [/\bseperate\b/g, 'separate'],
    [/\bseperately\b/g, 'separately'],
    [/\bdefinately\b/g, 'definitely'],
    [/\bneccessary\b/g, 'necessary'],
    [/\boccassion\b/g, 'occasion'],
    [/\boccassionally\b/g, 'occasionally'],
    [/\bimmediatly\b/g, 'immediately'],
    [/\bextremly\b/g, 'extremely'],
    [/\bgeneraly\b/g, 'generally'],
    [/\bprobaly\b/g, 'probably'],
    [/\brealy\b/g, 'really'],
    [/\busally\b/g, 'usually'],
    
    // Multiple spaces to single
    [/  +/g, ' '],
    
    // Space after opening paren
    [/\(\s+/g, '('],
    
    // Space before closing paren
    [/\s+\)/g, ')'],
];

function main() {
    console.log("=".repeat(70));
    console.log("AUTO-FIX COMMON ISSUES");
    console.log("=".repeat(70));
    
    const dbPath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    
    // Create backup
    fs.copyFileSync(dbPath, dbPath + '.backup_autofix');
    console.log("\n✅ Backup created: initial_db.enc.backup_autofix");
    
    const encBuffer = fs.readFileSync(dbPath);
    let content = decrypt(encBuffer);
    
    const originalLength = content.length;
    let totalFixes = 0;
    
    console.log("\nApplying fixes...\n");
    
    for (const [pattern, replacement] of SPELLING_FIXES) {
        const before = content;
        content = content.replace(pattern, replacement);
        const matches = before.match(pattern);
        if (matches) {
            console.log(`  Fixed: ${pattern.source} -> "${replacement}" (${matches.length} occurrences)`);
            totalFixes += matches.length;
        }
    }
    
    console.log(`\nTotal fixes applied: ${totalFixes}`);
    console.log(`Content length: ${originalLength} -> ${content.length}`);
    
    // Save
    fs.writeFileSync(dbPath, encrypt(content));
    console.log("\n✅ Saved initial_db.enc");
    
    // Verify
    const verifyBuffer = fs.readFileSync(dbPath);
    const verifyContent = decrypt(verifyBuffer);
    
    if (verifyContent.length === content.length) {
        console.log("✅ Verification passed");
    } else {
        console.log("⚠️ Verification length mismatch");
    }
}

main();
