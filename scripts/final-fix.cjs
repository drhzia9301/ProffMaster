/**
 * Final fix for the last 2 problematic explanations
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

function escapeForSql(str) {
    return str.replace(/'/g, "''");
}

function main() {
    const filePath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    
    console.log('Reading initial_db.enc...');
    const encryptedBuffer = fs.readFileSync(filePath);
    let content = decrypt(encryptedBuffer);
    
    // Fix 1: pharmacology_974
    // Search for unique part of the old explanation
    const old1 = "Let's check standard keys. Key consensus: b. Bupivacaine";
    const new1 = escapeForSql("Bupivacaine is highly lipid-soluble and protein-bound, resulting in inherently long duration of action. Adding vasoconstrictors (epinephrine) provides less proportional benefit compared to short-acting agents like lidocaine. The drug's pharmacokinetic properties already provide prolonged tissue binding.");
    
    // Find and show context
    let idx1 = content.indexOf("pharmacology_974");
    if (idx1 !== -1) {
        // Find the INSERT statement
        const stmt1Start = content.lastIndexOf('INSERT', idx1);
        const stmt1End = content.indexOf(');', idx1) + 2;
        const stmt1 = content.substring(stmt1Start, stmt1End);
        console.log('\n=== pharmacology_974 current statement ===');
        console.log(stmt1.substring(0, 500) + '...');
        
        // Find the exact explanation
        const explMatch = stmt1.match(/, 'Procaine has potent intrinsic/);
        if (explMatch) {
            console.log('\nFound explanation starting with "Procaine has potent..."');
        }
        
        // Do the replacement - find the complete old explanation
        const oldExpl1Full = `Procaine has potent intrinsic vasodilator properties, so vasoconstrictors are often needed but might be less effective compared to agents with less vasodilation or longer duration like Bupivacaine. However, standard teaching is that vasoconstrictors *significantly* prolong Procaine (short acting). Re-evaluating the question context: Bupivacaine is long acting and highly protein bound, so adding adrenaline prolongs it *less* proportionally than short acting drugs. Let''s check standard keys. Key consensus: b. Bupivacaine (or Etidocaine) because they are highly lipid soluble and protein bound, so washout is slow regardless of vasoconstriction.`;
        
        if (content.includes(oldExpl1Full)) {
            content = content.replace(oldExpl1Full, new1);
            console.log('✅ Fixed pharmacology_974');
        } else {
            console.log('⚠️ Exact explanation not found for pharmacology_974');
            // Try a different approach - find the insert and show more
            console.log('\nSearching for partial...');
            if (content.includes("Let''s check standard keys")) {
                console.log('Found "Let\'\'s check standard keys"');
            }
        }
    }
    
    // Fix 2: surgery_2088
    const old2Partial = "Let''s assume ''Large bowel obstruction''";
    
    let idx2 = content.indexOf("surgery_2088");
    if (idx2 !== -1) {
        const stmt2Start = content.lastIndexOf('INSERT', idx2);
        const stmt2End = content.indexOf(');', idx2) + 2;
        const stmt2 = content.substring(stmt2Start, stmt2End);
        console.log('\n=== surgery_2088 current statement ===');
        console.log(stmt2.substring(0, 800) + '...');
        
        // The old explanation is very long, let's find a unique pattern
        if (content.includes("Let''s assume ''Large bowel obstruction''")) {
            console.log('\nFound pattern in content');
            
            // Find the full explanation boundaries
            const expStart = content.indexOf("Marked vomiting (late feature in LBO");
            if (expStart !== -1) {
                // Find end - look for ', 'Medium')
                let expEnd = content.indexOf("', 'Medium')", expStart);
                if (expEnd !== -1) {
                    const oldExp = content.substring(expStart, expEnd);
                    console.log(`\nOld explanation length: ${oldExp.length}`);
                    
                    const new2 = escapeForSql("In a 60-year-old with lower abdominal pain, distention, and hyperactive bowel sounds, large bowel obstruction is likely. Common causes include colorectal carcinoma and sigmoid volvulus. Marked vomiting is typically an early feature of small bowel obstruction but occurs late in large bowel obstruction. Massive abdominal distention favors sigmoid volvulus.");
                    
                    content = content.substring(0, expStart) + new2 + content.substring(expEnd);
                    console.log('✅ Fixed surgery_2088');
                }
            }
        } else {
            console.log('Looking for other patterns...');
            if (content.includes("Large Bowel Obstruction (e.g., from cancer")) {
                console.log('Found "Large Bowel Obstruction (e.g., from cancer"');
            }
        }
    }
    
    // Save
    console.log('\nSaving...');
    const encryptedContent = encrypt(content);
    fs.writeFileSync(filePath, encryptedContent);
    console.log('💾 Saved initial_db.enc');
}

main();
