/**
 * Verify the fix for pharmacology_1066 was applied
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

function main() {
    const filePath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    
    console.log('Reading initial_db.enc...');
    const encryptedBuffer = fs.readFileSync(filePath);
    const content = decrypt(encryptedBuffer);
    
    // Find pharmacology_1066
    const idx = content.indexOf("pharmacology_1066");
    if (idx !== -1) {
        const stmtStart = content.lastIndexOf('INSERT', idx);
        const stmtEnd = content.indexOf(');', idx) + 2;
        const stmt = content.substring(stmtStart, stmtEnd);
        
        console.log('\n=== Current pharmacology_1066 statement ===');
        console.log(stmt);
        
        // Check what the explanation contains
        if (stmt.includes("Wait, TCAs definitely")) {
            console.log('\n❌ OLD explanation still present!');
        } else if (stmt.includes("TCAs cause anticholinergic effects")) {
            console.log('\n✅ NEW explanation is present');
        } else {
            console.log('\n⚠️ Unknown state');
        }
    } else {
        console.log('pharmacology_1066 not found');
    }
}

main();
