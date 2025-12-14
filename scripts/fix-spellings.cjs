/**
 * Comprehensive Auto-fix for all spelling issues
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
    console.log("=".repeat(70));
    console.log("COMPREHENSIVE SPELLING FIX");
    console.log("=".repeat(70));
    
    const dbPath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    
    // Create backup
    fs.copyFileSync(dbPath, dbPath + '.backup_spelling');
    console.log("\n✅ Backup created: initial_db.enc.backup_spelling");
    
    const encBuffer = fs.readFileSync(dbPath);
    let content = decrypt(encBuffer);
    
    let totalFixes = 0;
    
    // British to American spellings (simple string replace)
    const fixes = [
        ['colour', 'color'],
        ['Colour', 'Color'],
        ['tumour', 'tumor'],
        ['Tumour', 'Tumor'],
        ['programme', 'program'],
        ['Programme', 'Program'],
        ['centre', 'center'],
        ['Centre', 'Center'],
        ['haemorrhage', 'hemorrhage'],
        ['Haemorrhage', 'Hemorrhage'],
        ['recognise', 'recognize'],
        ['Recognise', 'Recognize'],
        ['recognised', 'recognized'],
        ['Recognised', 'Recognized'],
        ['anaemia', 'anemia'],
        ['Anaemia', 'Anemia'],
        ['oedema', 'edema'],
        ['Oedema', 'Edema'],
        ['foetus', 'fetus'],
        ['Foetus', 'Fetus'],
        ['haemoglobin', 'hemoglobin'],
        ['Haemoglobin', 'Hemoglobin'],
        ['leucocyte', 'leukocyte'],
        ['Leucocyte', 'Leukocyte'],
        ['favour', 'favor'],
        ['Favour', 'Favor'],
        ['behaviour', 'behavior'],
        ['Behaviour', 'Behavior'],
        ['fibre', 'fiber'],
        ['Fibre', 'Fiber'],
        ['litre', 'liter'],
        ['Litre', 'Liter'],
        ['metre', 'meter'],
        ['Metre', 'Meter'],
        ['diarrhoea', 'diarrhea'],
        ['Diarrhoea', 'Diarrhea'],
        ['paediatric', 'pediatric'],
        ['Paediatric', 'Pediatric'],
        ['labelled', 'labeled'],
        ['Labelled', 'Labeled'],
        ['modelled', 'modeled'],
        ['Modelled', 'Modeled'],
        ['cancelling', 'canceling'],
        ['Cancelling', 'Canceling'],
        ['travelling', 'traveling'],
        ['Travelling', 'Traveling'],
        ['focussed', 'focused'],
        ['Focussed', 'Focused'],
    ];
    
    console.log("\nApplying British to American spelling fixes...\n");
    
    for (const [british, american] of fixes) {
        const regex = new RegExp(`\\b${british}\\b`, 'g');
        const matches = content.match(regex);
        if (matches) {
            content = content.replace(regex, american);
            console.log(`  Fixed: "${british}" -> "${american}" (${matches.length} occurrences)`);
            totalFixes += matches.length;
        }
    }
    
    // Fix typo 'adn' -> 'and'
    const adnMatches = content.match(/\badn\b/g);
    if (adnMatches) {
        content = content.replace(/\badn\b/g, 'and');
        console.log(`  Fixed: "adn" -> "and" (${adnMatches.length} occurrences)`);
        totalFixes += adnMatches.length;
    }
    
    console.log(`\nTotal fixes applied: ${totalFixes}`);
    
    // Save
    fs.writeFileSync(dbPath, encrypt(content));
    console.log("✅ Saved initial_db.enc");
}

main();
