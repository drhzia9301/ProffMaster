/**
 * Fix medulloblastoma question in initial_db.enc
 * Change "Occurs in cerebrum" to "Occurs in cerebellum"
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
    console.log("=== Fixing Medulloblastoma Question ===\n");
    
    const dbPath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    const encBuffer = fs.readFileSync(dbPath);
    let content = decrypt(encBuffer);
    
    // Find the question
    const searchText = 'b. Occurs in cerebrum';
    const correctText = 'b. Occurs in cerebellum';
    
    // Also fix in options array
    const oldOptions = '"b. Occurs in cerebrum"';
    const newOptions = '"b. Occurs in cerebellum"';
    
    // Fix old explanation
    const oldExplanation = "Medulloblastomas occur exclusively in the cerebellum (posterior fossa), not the cerebrum. (Note: Option E ''Is radioactive'' is likely a typo for ''Is radiosensitive'', which is true, or is an obvious distractor).";
    const newExplanation = "Medulloblastoma is a highly malignant cerebellar tumor that predominantly occurs in childhood. It has a desmoplastic variant and is radiosensitive. It occurs in the cerebellum (posterior fossa), making ''Occurs in cerebellum'' a TRUE statement - therefore it is NOT the false answer. The correct answer to this question should identify a FALSE statement about medulloblastoma.";
    
    console.log("Searching for:", searchText);
    
    if (content.includes(searchText)) {
        // Replace the option text
        content = content.replace(new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correctText);
        console.log("✅ Fixed option: 'cerebrum' -> 'cerebellum'");
        
        // Replace in options array
        content = content.replace(new RegExp(oldOptions.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newOptions);
        console.log("✅ Fixed options array");
        
        // Replace explanation
        if (content.includes(oldExplanation)) {
            content = content.replace(oldExplanation, newExplanation);
            console.log("✅ Fixed explanation");
        } else {
            console.log("⚠️ Old explanation not found exactly, searching...");
            // Try partial match
            const partialOld = "Medulloblastomas occur exclusively in the cerebellum";
            if (content.includes(partialOld)) {
                const idx = content.indexOf(partialOld);
                const endIdx = content.indexOf("'", idx + 100);
                const currentExpl = content.substring(idx, endIdx);
                console.log("Found explanation:", currentExpl.substring(0, 100) + "...");
            }
        }
        
        // Save
        fs.copyFileSync(dbPath, dbPath + '.backup_medullo');
        fs.writeFileSync(dbPath, encrypt(content));
        console.log("\n✅ Saved initial_db.enc");
        
        // Verify
        const verifyBuffer = fs.readFileSync(dbPath);
        const verifyContent = decrypt(verifyBuffer);
        if (verifyContent.includes(correctText)) {
            console.log("✅ Verified: Option now says 'cerebellum'");
        }
    } else {
        console.log("❌ Search text not found");
    }
}

main();
