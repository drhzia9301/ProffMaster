/**
 * Fix the remaining 2 ENT parsing errors
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
    console.log('Fixing ENT parsing errors...');
    
    const dbPath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    const encBuffer = fs.readFileSync(dbPath);
    let content = decrypt(encBuffer);
    
    // Fix ent_547
    const old547 = `'['a. Orbital cellulitis', 'b. Subperiosteal abscess', 'c. Meningitis', 'Option D']'`;
    const new547 = `'["a. Orbital cellulitis", "b. Subperiosteal abscess", "c. Meningitis", "d. Brain abscess"]'`;
    
    if (content.includes(old547)) {
        content = content.replace(old547, new547);
        console.log('✅ Fixed ent_547');
    } else {
        console.log('⚠️ ent_547 pattern not found, trying alternative...');
        // Try without outer quotes
        const alt547 = `['a. Orbital cellulitis', 'b. Subperiosteal abscess', 'c. Meningitis', 'Option D']`;
        const altNew547 = `["a. Orbital cellulitis", "b. Subperiosteal abscess", "c. Meningitis", "d. Brain abscess"]`;
        if (content.includes(alt547)) {
            content = content.replace(alt547, altNew547);
            console.log('✅ Fixed ent_547 (alt)');
        }
    }
    
    // Fix ent_623
    const old623 = `'['a. 1st and 2nd tracheal rings', 'b. 2nd and 3rd tracheal rings', 'c. 3rd and 4th tracheal rings', 'Option D']'`;
    const new623 = `'["a. 1st and 2nd tracheal rings", "b. 2nd and 3rd tracheal rings", "c. 3rd and 4th tracheal rings", "d. 4th and 5th tracheal rings"]'`;
    
    if (content.includes(old623)) {
        content = content.replace(old623, new623);
        console.log('✅ Fixed ent_623');
    } else {
        console.log('⚠️ ent_623 pattern not found, trying alternative...');
        const alt623 = `['a. 1st and 2nd tracheal rings', 'b. 2nd and 3rd tracheal rings', 'c. 3rd and 4th tracheal rings', 'Option D']`;
        const altNew623 = `["a. 1st and 2nd tracheal rings", "b. 2nd and 3rd tracheal rings", "c. 3rd and 4th tracheal rings", "d. 4th and 5th tracheal rings"]`;
        if (content.includes(alt623)) {
            content = content.replace(alt623, altNew623);
            console.log('✅ Fixed ent_623 (alt)');
        }
    }
    
    fs.writeFileSync(dbPath, encrypt(content));
    console.log('✅ Saved');
}

main();
