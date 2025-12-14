/**
 * Remove the specific weird question from WMC M2
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
    console.log("=== Removing Weird Question from WMC M2 ===\n");
    
    const wmcPath = path.join(__dirname, '..', 'public', 'qbanks', 'wmc M2.enc');
    const wmcBuffer = fs.readFileSync(wmcPath);
    let wmcContent = decrypt(wmcBuffer);
    
    const lines = wmcContent.split('\n');
    console.log(`Total lines: ${lines.length}`);
    
    // Find the weird question (line 1 based on previous search)
    const weirdLine = lines.find(line => 
        line.includes('All of the following are t') && 
        line.includes('Chalazion')
    );
    
    if (weirdLine) {
        console.log(`Found weird question: ${weirdLine.substring(0, 200)}...`);
        
        // Remove it
        const beforeCount = lines.filter(l => l.includes('INSERT INTO preproff')).length;
        const filteredLines = lines.filter(line => line !== weirdLine);
        const afterCount = filteredLines.filter(l => l.includes('INSERT INTO preproff')).length;
        
        console.log(`Before: ${beforeCount} questions`);
        console.log(`After: ${afterCount} questions`);
        console.log(`Removed: ${beforeCount - afterCount} question(s)`);
        
        wmcContent = filteredLines.join('\n');
        
        // Save
        fs.copyFileSync(wmcPath, wmcPath + '.backup7');
        fs.writeFileSync(wmcPath, encrypt(wmcContent));
        console.log('\n✅ Saved WMC M2');
    } else {
        console.log('❌ Weird question not found');
    }
}

main();
