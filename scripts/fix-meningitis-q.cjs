/**
 * Fix the meningitis question (pathology_1491)
 * Change answer to d. Streptococcus pneumoniae (index 3)
 * Add comprehensive age-based explanation
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
    
    // Find pathology_1491
    const questionId = 'pathology_1491';
    const idx = content.indexOf(`'${questionId}'`);
    
    if (idx === -1) {
        console.log('Question not found!');
        return;
    }
    
    // Find the INSERT statement
    const stmtStart = content.lastIndexOf('INSERT', idx);
    const stmtEnd = content.indexOf(');', idx) + 2;
    const oldStmt = content.substring(stmtStart, stmtEnd);
    
    console.log('Found question. Creating fixed statement...\n');
    
    // New explanation with age-based breakdown
    const newExplanation = escapeForSql(`Streptococcus pneumoniae is the most common cause of bacterial meningitis in children aged 3 months to 5 years (post-Hib vaccination era).

Age-based causative agents:
• Neonates (0-3 months): E. coli, Group B Streptococcus, Listeria monocytogenes
• Infants/Children (3 months - 5 years): Streptococcus pneumoniae (MOST COMMON), Haemophilus influenzae type b (Hib - only if unvaccinated)
• Children >5 years and Adults: S. pneumoniae, Neisseria meningitidis

In this 2-year-old with classic bacterial meningitis (cloudy CSF, neutrophils, high protein, low glucose), S. pneumoniae is the most likely cause.`);
    
    // Build new statement
    const newStmt = `INSERT OR REPLACE INTO questions (id, subject, topic, question, options, correct_answer, correct_index, explanation, difficulty) VALUES ('pathology_1491', 'Pathology', 'CNS PATHOLOGY', 'A 2 year old child presents with fever, headache, prostration and nuchal rigidity. The cerebrospinal fluid is cloudy and microscopic examination reveals innumerable neutrophils. The CSF protein is increased and glucose is decreased. The most likely etiological agent is:', '["a. Escherichia coli", "b. Haemophilus influenza", "c. Group B streptococci", "d. Streptococcus pneumoniae", "e. Staphylococcus aureus"]', 'd. Streptococcus pneumoniae', 3, '${newExplanation}', 'Medium');`;
    
    // Replace
    content = content.replace(oldStmt, newStmt);
    
    console.log('=== NEW STATEMENT ===');
    console.log(newStmt);
    
    // Save
    const encryptedContent = encrypt(content);
    fs.writeFileSync(filePath, encryptedContent);
    console.log('\n✅ Fixed and saved!');
}

main();
