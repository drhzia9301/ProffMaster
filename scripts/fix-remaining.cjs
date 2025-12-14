/**
 * Investigate and fix remaining issues:
 * - 8 parsing errors
 * - 24 remaining spelling issues
 * - Pattern issues (view but don't auto-fix)
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

function main() {
    console.log('='.repeat(70));
    console.log('INVESTIGATING AND FIXING REMAINING ISSUES');
    console.log('='.repeat(70));
    
    const dbPath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    const encBuffer = fs.readFileSync(dbPath);
    let content = decrypt(encBuffer);
    
    // Part 1: Investigate parsing errors
    console.log('\n=== PARSING ERRORS ===\n');
    
    const parseErrorIds = [
        'ent_547', 'ent_623', 'ent_642', 
        'forensic_medicine_1620', 'forensic_medicine_1636',
        'pharmacology_1095', 'surgery_2169', 'medicine_2218'
    ];
    
    for (const id of parseErrorIds) {
        const marker = "'" + id + "'";
        const idx = content.indexOf(marker);
        if (idx > 0) {
            // Find the options part
            const lineStart = content.lastIndexOf('INSERT', idx);
            const lineEnd = content.indexOf(';', idx);
            const line = content.substring(lineStart, lineEnd + 1);
            
            // Extract options
            const optMatch = line.match(/\[.*?\]/);
            if (optMatch) {
                try {
                    JSON.parse(optMatch[0]);
                    console.log(`${id}: Options valid`);
                } catch (e) {
                    console.log(`${id}: MALFORMED - ${optMatch[0].substring(0, 80)}...`);
                    
                    // Try to fix common issues
                    let fixed = optMatch[0];
                    // Fix escaped quotes issues
                    fixed = fixed.replace(/\\'/g, "'");
                    // Fix double escapes
                    fixed = fixed.replace(/\\\\"/g, '\\"');
                    
                    try {
                        JSON.parse(fixed);
                        console.log(`  -> Fixed!`);
                        content = content.replace(optMatch[0], fixed);
                    } catch (e2) {
                        console.log(`  -> Still broken, needs manual fix`);
                    }
                }
            }
        }
    }
    
    // Part 2: Fix remaining spelling
    console.log('\n=== FIXING REMAINING SPELLING ===\n');
    
    const spellingFixes = [
        [/\badn\b/g, 'and'],
        [/\btravelled\b/g, 'traveled'],
        [/\bTravelled\b/g, 'Traveled'],
        [/\bfavourable\b/gi, 'favorable'],
        [/\bunfavourable\b/gi, 'unfavorable'],
        [/\bhonourable\b/gi, 'honorable'],
        [/\bcoloured\b/gi, 'colored'],
        [/\btumours\b/gi, 'tumors'],
        [/\bhaemorrhages\b/gi, 'hemorrhages'],
        [/\banaemic\b/gi, 'anemic'],
    ];
    
    let totalFixes = 0;
    
    for (const [pattern, replacement] of spellingFixes) {
        const matches = content.match(pattern);
        if (matches) {
            content = content.replace(pattern, replacement);
            console.log(`Fixed: ${pattern.source} -> "${replacement}" (${matches.length})`);
            totalFixes += matches.length;
        }
    }
    
    console.log(`\nTotal spelling fixes: ${totalFixes}`);
    
    // Part 3: Count pattern issues (just report, don't fix)
    console.log('\n=== PATTERN ISSUES (info only) ===\n');
    
    const shortExplanations = content.match(/, '[^']{0,20}', 'Medium'\)/g);
    console.log(`Short explanations (<20 chars): ${shortExplanations ? shortExplanations.length : 0}`);
    
    const aiPatterns = content.match(/Let me |Actually,|Wait,|Let's /gi);
    console.log(`AI thinking patterns: ${aiPatterns ? aiPatterns.length : 0}`);
    
    const duplicateRefs = content.match(/Duplicate of ID/gi);
    console.log(`Duplicate references: ${duplicateRefs ? duplicateRefs.length : 0}`);
    
    // Save
    console.log('\n=== SAVING ===\n');
    fs.copyFileSync(dbPath, dbPath + '.backup_final');
    fs.writeFileSync(dbPath, encrypt(content));
    console.log('✅ Saved initial_db.enc');
}

main();
