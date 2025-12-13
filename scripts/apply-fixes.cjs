/**
 * Apply fixed explanations to encrypted question bank files
 * This script will:
 * 1. Decrypt each file
 * 2. Find and replace problematic explanations
 * 3. Re-encrypt and save
 */

const fs = require('fs');
const path = require('path');
const { FIXED_EXPLANATIONS } = require('./fixed-explanations.cjs');

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

function escapeForJson(str) {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function applyFixes() {
    console.log('=' .repeat(70));
    console.log('🔧 APPLYING FIXED EXPLANATIONS');
    console.log('=' .repeat(70));
    
    // Group fixes by file
    const fixesByFile = {};
    for (const fix of FIXED_EXPLANATIONS) {
        if (!fixesByFile[fix.file]) fixesByFile[fix.file] = [];
        fixesByFile[fix.file].push(fix);
    }
    
    let totalFixed = 0;
    let filesProcessed = 0;
    
    for (const [fileName, fixes] of Object.entries(fixesByFile)) {
        console.log(`\n📂 Processing: ${fileName} (${fixes.length} fixes)`);
        
        // Determine file path
        let filePath;
        if (fileName === 'initial_db.enc') {
            filePath = path.join(__dirname, '..', 'public', 'assets', fileName);
        } else {
            filePath = path.join(__dirname, '..', 'public', 'qbanks', fileName);
        }
        
        if (!fs.existsSync(filePath)) {
            console.log(`   ⚠️ File not found: ${filePath}`);
            continue;
        }
        
        // Read and decrypt
        const encryptedBuffer = fs.readFileSync(filePath);
        let content = decrypt(encryptedBuffer);
        let fixesApplied = 0;
        
        for (const fix of fixes) {
            const fixedExplanation = fix.fixedExplanation;
            
            if (fileName === 'initial_db.enc') {
                // For initial_db.enc, we need to find by question ID
                const questionId = fix.id;
                
                // Find the INSERT statement for this question
                // Pattern: VALUES ('question_id', ... , 'explanation', 'difficulty')
                // The explanation is the 8th value (index 7)
                
                // Build a regex to find this specific question's explanation
                const idPattern = `'${questionId}'`;
                const idIndex = content.indexOf(idPattern);
                
                if (idIndex === -1) {
                    console.log(`   ⚠️ Could not find ID: ${questionId}`);
                    continue;
                }
                
                // Find the INSERT statement containing this ID
                const insertStart = content.lastIndexOf('INSERT', idIndex);
                const insertEnd = content.indexOf(');', idIndex);
                
                if (insertStart === -1 || insertEnd === -1) {
                    console.log(`   ⚠️ Could not find INSERT boundaries for: ${questionId}`);
                    continue;
                }
                
                const insertStatement = content.substring(insertStart, insertEnd + 2);
                
                // Parse out the current explanation (it's after 'correct_index' and before 'difficulty')
                // Format: ..., correct_index, 'explanation', 'difficulty')
                
                // Find explanation field - it's between the 7th and 8th commas in VALUES
                const valuesStart = insertStatement.indexOf('VALUES');
                if (valuesStart === -1) continue;
                
                const valuesSection = insertStatement.substring(valuesStart);
                
                // Find the explanation by looking for pattern after correct_index (a number)
                // The structure is: id, subject, topic, question, options, correct_answer, correct_index, explanation, difficulty
                
                // Use a more robust approach - find the portion with an extremely long string
                // that contains our problematic patterns
                const problemPatterns = ['Wait,', 'Actually,', 'Let\'s re-evaluate', 'If forced to', 'the question implies'];
                
                let foundPattern = false;
                for (const pattern of problemPatterns) {
                    if (insertStatement.includes(pattern)) {
                        foundPattern = true;
                        break;
                    }
                }
                
                if (!foundPattern) {
                    console.log(`   ⚠️ Patterns not found in statement for: ${questionId}`);
                    continue;
                }
                
                // Extract the old explanation - find the long string between quotes
                // Look for the explanation field specifically
                // It comes after correct_index (a digit) and before 'difficulty'
                const explanationMatch = insertStatement.match(/,\s*(\d+)\s*,\s*'([^']*(?:''[^']*)*)'\s*,\s*'(Easy|Medium|Hard)'\)/i);
                
                if (explanationMatch) {
                    const oldExplanation = explanationMatch[2];
                    const escapedNewExplanation = escapeForSql(fixedExplanation);
                    
                    // Replace the old explanation with the new one
                    const newInsertStatement = insertStatement.replace(
                        `, '${oldExplanation}',`,
                        `, '${escapedNewExplanation}',`
                    );
                    
                    content = content.replace(insertStatement, newInsertStatement);
                    fixesApplied++;
                    console.log(`   ✅ Fixed: ${questionId}`);
                } else {
                    console.log(`   ⚠️ Could not parse explanation for: ${questionId}`);
                }
                
            } else {
                // For preproff files (both SQL and JSON format)
                
                // Check if it's JSON format
                if (content.trim().startsWith('[')) {
                    // JSON format
                    try {
                        let questions = JSON.parse(content);
                        if (Array.isArray(questions)) {
                            questions = questions.flat();
                            
                            if (fix.index < questions.length) {
                                const oldExp = questions[fix.index].explanation;
                                questions[fix.index].explanation = fixedExplanation;
                                content = JSON.stringify(questions, null, 2);
                                fixesApplied++;
                                console.log(`   ✅ Fixed index ${fix.index} (JSON)`);
                            }
                        }
                    } catch (e) {
                        console.log(`   ⚠️ JSON parse failed for ${fileName}`);
                    }
                } else {
                    // SQL format - similar approach
                    // Find the INSERT at the specific index
                    const insertRegex = /INSERT\s+INTO\s+preproff\s*\([^)]+\)\s*VALUES\s*\((.+?)\)(?:;|$|\r?\n)/gi;
                    let match;
                    let currentIndex = 0;
                    let found = false;
                    
                    while ((match = insertRegex.exec(content)) !== null && !found) {
                        if (currentIndex === fix.index) {
                            const fullMatch = match[0];
                            const valuesStr = match[1];
                            
                            // Find the explanation field (4th value, index 3)
                            // Format: text, options, correct_index, explanation, ...
                            const explanationMatch = valuesStr.match(/,\s*(\d+)\s*,\s*'([^']*(?:''[^']*)*)'\s*,/);
                            
                            if (explanationMatch) {
                                const oldExplanation = explanationMatch[2];
                                const escapedNewExplanation = escapeForSql(fixedExplanation);
                                
                                const newValuesStr = valuesStr.replace(
                                    `, '${oldExplanation}',`,
                                    `, '${escapedNewExplanation}',`
                                );
                                
                                const newFullMatch = fullMatch.replace(valuesStr, newValuesStr);
                                content = content.replace(fullMatch, newFullMatch);
                                fixesApplied++;
                                console.log(`   ✅ Fixed index ${fix.index} (SQL)`);
                            }
                            found = true;
                        }
                        currentIndex++;
                    }
                    
                    if (!found) {
                        console.log(`   ⚠️ Could not find index ${fix.index} in ${fileName}`);
                    }
                }
            }
        }
        
        if (fixesApplied > 0) {
            // Encrypt and write back
            const encryptedContent = encrypt(content);
            
            // Create backup
            const backupPath = filePath + '.backup';
            if (!fs.existsSync(backupPath)) {
                fs.copyFileSync(filePath, backupPath);
                console.log(`   📦 Backup created: ${path.basename(backupPath)}`);
            }
            
            // Write fixed file
            fs.writeFileSync(filePath, encryptedContent);
            console.log(`   💾 Saved: ${fileName} (${fixesApplied} fixes applied)`);
            
            totalFixed += fixesApplied;
            filesProcessed++;
        }
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 SUMMARY');
    console.log('=' .repeat(70));
    console.log(`Files processed: ${filesProcessed}`);
    console.log(`Total fixes applied: ${totalFixed}/${FIXED_EXPLANATIONS.length}`);
    
    if (totalFixed < FIXED_EXPLANATIONS.length) {
        console.log(`\n⚠️ Some fixes could not be applied automatically.`);
        console.log(`   These may require manual intervention.`);
    } else {
        console.log(`\n✅ All fixes applied successfully!`);
    }
}

applyFixes();
