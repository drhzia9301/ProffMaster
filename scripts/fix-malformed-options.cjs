/**
 * Fix the 5 malformed options with placeholder text
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
    console.log('FIXING MALFORMED OPTIONS');
    console.log('='.repeat(70));
    
    const dbPath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    const encBuffer = fs.readFileSync(dbPath);
    let content = decrypt(encBuffer);
    
    // Fix pattern: 'Option C', 'Option D' -> proper options
    const fixes = [
        // ent_547: Sinusitis complications - fix Options C and D
        {
            id: 'ent_547',
            oldOptions: `['a. Orbital cellulitis', 'b. Subperiosteal abscess', 'c. Meningitis', 'Option D', 'Option E']`,
            newOptions: `["a. Orbital cellulitis", "b. Subperiosteal abscess", "c. Meningitis", "d. Cavernous sinus thrombosis", "e. Brain abscess"]`
        },
        // ent_623: Tracheostomy site
        {
            id: 'ent_623',
            oldOptions: `['a. 1st and 2nd tracheal rings', 'b. 2nd and 3rd tracheal rings', 'c. 3rd and 4th tracheal rings', 'Option D', 'Option E']`,
            newOptions: `["a. 1st and 2nd tracheal rings", "b. 2nd and 3rd tracheal rings", "c. 3rd and 4th tracheal rings", "d. 4th and 5th tracheal rings", "e. Cricothyroid membrane"]`
        },
        // ent_642: Neck mass
        {
            id: 'ent_642',
            oldOptions: `['a. Nasopharyngeal carcinoma', 'b. Nasal polyp', 'Option C', 'Option D']`,
            newOptions: `["a. Nasopharyngeal carcinoma", "b. Nasal polyp", "c. Acoustic neuroma", "d. Laryngeal carcinoma"]`
        },
        // forensic_medicine_1620 and 1636: Chromogenic tears (duplicates with same issue)
        {
            id: 'forensic_medicine_1620',
            oldOptions: `['a. Opium poisoning', 'b. Barbiturate poisoning', 'c. Organophosphorus poisoning', 'Option D']`,
            newOptions: `["a. Opium poisoning", "b. Barbiturate poisoning", "c. Organophosphorus poisoning", "d. Rifampicin poisoning"]`
        },
        {
            id: 'forensic_medicine_1636',
            oldOptions: `['a. Opium poisoning', 'b. Barbiturate poisoning', 'c. Organophosphorus poisoning', 'Option D']`,
            newOptions: `["a. Opium poisoning", "b. Barbiturate poisoning", "c. Organophosphorus poisoning", "d. Rifampicin poisoning"]`
        }
    ];
    
    let fixedCount = 0;
    
    for (const fix of fixes) {
        if (content.includes(fix.oldOptions)) {
            content = content.replace(fix.oldOptions, fix.newOptions);
            console.log(`✅ Fixed ${fix.id}`);
            fixedCount++;
        } else {
            // Try to find and show what's there
            const idIdx = content.indexOf("'" + fix.id + "'");
            if (idIdx > 0) {
                const snippet = content.substring(idIdx, idIdx + 300);
                console.log(`⚠️ ${fix.id}: Pattern not matched exactly`);
                console.log(`   Looking for: ${fix.oldOptions.substring(0, 60)}...`);
            }
        }
    }
    
    console.log(`\nFixed ${fixedCount} malformed options`);
    
    // Save
    fs.writeFileSync(dbPath, encrypt(content));
    console.log('✅ Saved initial_db.enc');
}

main();
