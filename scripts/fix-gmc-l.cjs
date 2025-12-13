/**
 * Fix the remaining "Actually," pattern in gmc L.enc
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
    const filePath = path.join(__dirname, '..', 'public', 'qbanks', 'gmc L.enc');
    
    console.log('Reading gmc L.enc...');
    const encryptedBuffer = fs.readFileSync(filePath);
    let content = decrypt(encryptedBuffer);
    
    // Find the problematic section with "Actually,"
    const searchPattern = "(Actually, diabetes is a risk factor for pancreatic cancer";
    const idx = content.indexOf(searchPattern);
    
    if (idx !== -1) {
        console.log('Found pattern at index:', idx);
        
        // Show context
        const contextStart = Math.max(0, content.lastIndexOf("'", idx) - 500);
        const contextEnd = Math.min(content.length, idx + 600);
        console.log('\nContext:');
        console.log(content.substring(contextStart, contextEnd));
        
        // This is in an options array (inside the option text, not explanation)
        // The "(Actually, ..." is part of a comment in the option text, not the explanation
        // Let me check if this is in the OPTIONS field or EXPLANATION field
        
        // Find the INSERT statement
        const insertStart = content.lastIndexOf('INSERT', idx);
        const insertEnd = content.indexOf(');', idx);
        const stmt = content.substring(insertStart, insertEnd + 2);
        
        console.log('\n=== INSERT statement ===');
        console.log(stmt);
        
        // It seems this "Actually" is embedded in the options array as a comment
        // Let me check if this is actually in explanation
        if (stmt.includes("\"Pancreatic carcinoma (Actually,")) {
            console.log('\n⚠️ The "Actually," pattern is inside an OPTION text, not the explanation.');
            console.log('   This is a legacy comment in the option that should be cleaned up.');
            
            // Clean up the option text - remove the parenthetical comment
            const oldOption = '"Pancreatic carcinoma (Actually, diabetes is a risk factor for pancreatic cancer, but relative to complications, this is often the \'\'except\'\' distractor in older contexts or implies a specific type. However, commonly: Diabetes increases risk of all A-D. Pancreatic Ca is also increased. Perhaps the intended answer is based on context or outdated teaching.)"';
            const newOption = '"Pancreatic carcinoma"';
            
            if (content.includes(oldOption)) {
                content = content.replace(oldOption, newOption);
                console.log('✅ Cleaned up option text');
            } else {
                // Try with single escaped quotes
                const oldOption2 = `"Pancreatic carcinoma (Actually, diabetes is a risk factor for pancreatic cancer, but relative to complications, this is often the ''except'' distractor in older contexts or implies a specific type. However, commonly: Diabetes increases risk of all A-D. Pancreatic Ca is also increased. Perhaps the intended answer is based on context or outdated teaching.)"`;
                if (content.includes(oldOption2)) {
                    content = content.replace(oldOption2, newOption);
                    console.log('✅ Cleaned up option text (variant 2)');
                } else {
                    // Just replace the parenthetical comment
                    const pattern = /\(Actually, diabetes is a risk factor for pancreatic cancer[^)]+\)/g;
                    const before = content.length;
                    content = content.replace(pattern, '');
                    if (content.length < before) {
                        console.log('✅ Removed parenthetical comment');
                    } else {
                        console.log('⚠️ Could not find pattern to replace');
                    }
                }
            }
        }
    } else {
        console.log('Pattern not found');
    }
    
    // Save
    const encryptedContent = encrypt(content);
    fs.writeFileSync(filePath, encryptedContent);
    console.log('\n💾 Saved gmc L.enc');
}

main();
