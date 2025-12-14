/**
 * Fix remaining spelling and parsing issues
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
    console.log('FINAL CLEANUP');
    console.log('='.repeat(70));
    
    const dbPath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    const encBuffer = fs.readFileSync(dbPath);
    let content = decrypt(encBuffer);
    
    // Fix remaining spelling
    console.log('\nFixing remaining spelling...\n');
    
    // Find and fix "adn" typo
    const adnRegex = / adn /g;
    const adnMatches = content.match(adnRegex);
    if (adnMatches) {
        content = content.replace(adnRegex, ' and ');
        console.log(`Fixed "adn" -> "and": ${adnMatches.length}`);
    }
    
    // Fix remaining oedema variations
    content = content.replace(/\boedema\b/gi, 'edema');
    content = content.replace(/\bOedema\b/g, 'Edema');
    
    // Fix haemoglobin variations
    content = content.replace(/\bhaemoglobin\b/gi, 'hemoglobin');
    
    // Fix colour/color variations
    content = content.replace(/\bcolour\b/gi, 'color');
    
    // Investigate and fix parsing errors
    console.log('\nInvestigating parsing errors...\n');
    
    const errorIds = ['medicine_2290', 'ophthalmology_75', 'ophthalmology_306'];
    
    for (const id of errorIds) {
        const idx = content.indexOf(`'${id}'`);
        if (idx > 0) {
            const lineStart = content.lastIndexOf('INSERT', idx);
            const lineEnd = content.indexOf(';', idx);
            const line = content.substring(lineStart, lineEnd + 1);
            
            // Look for malformed options with single quotes instead of double
            const optMatch = line.match(/'\[.*?\]'/);
            if (optMatch) {
                let opts = optMatch[0];
                // Check if it uses single quotes inside
                if (opts.includes("'a.") || opts.includes("'b.") || opts.includes("'Option")) {
                    console.log(`${id}: Has single-quoted options, fixing...`);
                    // Replace single quotes with double quotes inside the array
                    let fixed = opts
                        .replace(/'\['/g, '\'["')
                        .replace(/'\]'/g, '"]\'')
                        .replace(/', '/g, '", "')
                        .replace(/\['([^"'])/g, '["$1')
                        .replace(/([^"'])'\]/g, '$1"]');
                    
                    // More aggressive fix
                    fixed = opts.replace(/'/g, '"').replace(/^"/, "'").replace(/"$/, "'");
                    
                    if (fixed !== opts) {
                        content = content.replace(opts, fixed);
                        console.log(`  Fixed!`);
                    }
                }
            }
        }
    }
    
    // Save
    console.log('\nSaving...');
    fs.copyFileSync(dbPath, dbPath + '.backup_cleanup');
    fs.writeFileSync(dbPath, encrypt(content));
    console.log('✅ Done');
}

main();
