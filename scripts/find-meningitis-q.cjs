/**
 * Find and fix the meningitis question
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
    const filePath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    
    console.log('Reading initial_db.enc...');
    const encryptedBuffer = fs.readFileSync(filePath);
    let content = decrypt(encryptedBuffer);
    
    // Search for the question about 2 year old child with meningitis
    const searchTerms = [
        "2 year old child presents with fever",
        "cerebrospinal fluid is cloudy",
        "nuchal rigidity"
    ];
    
    for (const term of searchTerms) {
        const idx = content.indexOf(term);
        if (idx !== -1) {
            console.log(`Found "${term}" at index ${idx}`);
            
            // Find the INSERT statement
            const stmtStart = content.lastIndexOf('INSERT', idx);
            const stmtEnd = content.indexOf(');', idx) + 2;
            const stmt = content.substring(stmtStart, stmtEnd);
            
            console.log('\n=== Current statement ===');
            console.log(stmt);
            
            // Extract the question ID
            const idMatch = stmt.match(/'(pathology_\d+)'/);
            if (idMatch) {
                console.log('\nQuestion ID:', idMatch[1]);
            }
            
            break;
        }
    }
}

main();
