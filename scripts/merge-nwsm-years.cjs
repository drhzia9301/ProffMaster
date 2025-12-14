/**
 * Merge NWSM 2023 questions into 2025 (change year from 2023 to 2025)
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
    console.log("MERGING NWSM 2023 INTO 2025");
    console.log("=".repeat(70));
    
    const files = ['nwsm M1.enc', 'nwsm M2.enc'];
    
    for (const file of files) {
        const filePath = path.join(__dirname, '..', 'public', 'qbanks', file);
        console.log(`\nProcessing: ${file}`);
        
        // Backup
        fs.copyFileSync(filePath, filePath + '.backup_merge');
        
        // Load and decrypt
        const content = decrypt(fs.readFileSync(filePath));
        
        // Count before
        const count2023Before = (content.match(/'2023'/g) || []).length;
        const count2025Before = (content.match(/'2025'/g) || []).length;
        
        console.log(`  Before: ${count2023Before} questions with '2023', ${count2025Before} with '2025'`);
        
        // Replace '2023' with '2025'
        const newContent = content.replace(/'2023'/g, "'2025'");
        
        // Count after
        const count2023After = (newContent.match(/'2023'/g) || []).length;
        const count2025After = (newContent.match(/'2025'/g) || []).length;
        
        console.log(`  After: ${count2023After} questions with '2023', ${count2025After} with '2025'`);
        
        // Save
        fs.writeFileSync(filePath, encrypt(newContent));
        console.log(`  ✅ Saved`);
    }
    
    console.log("\n" + "=".repeat(70));
    console.log("DONE - All NWSM questions are now 2025");
    console.log("=".repeat(70));
}

main();
