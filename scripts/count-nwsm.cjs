/**
 * Count NWSM 2025 questions in M1 and M2
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
    console.log("=".repeat(70));
    console.log("NWSM PREPROFF QUESTION COUNT");
    console.log("=".repeat(70));
    
    const m1Path = path.join(__dirname, '..', 'public', 'qbanks', 'nwsm M1.enc');
    const m2Path = path.join(__dirname, '..', 'public', 'qbanks', 'nwsm M2.enc');
    
    const m1Content = decrypt(fs.readFileSync(m1Path));
    const m2Content = decrypt(fs.readFileSync(m2Path));
    
    // Count total questions
    const m1Statements = m1Content.split(/INSERT INTO preproff|INSERT OR REPLACE INTO preproff/).slice(1);
    const m2Statements = m2Content.split(/INSERT INTO preproff|INSERT OR REPLACE INTO preproff/).slice(1);
    
    // Count 2025 questions
    const m1_2025 = m1Statements.filter(s => s.includes("'2025'")).length;
    const m2_2025 = m2Statements.filter(s => s.includes("'2025'")).length;
    
    // Count other years
    const m1_2024 = m1Statements.filter(s => s.includes("'2024'")).length;
    const m1_2023 = m1Statements.filter(s => s.includes("'2023'")).length;
    const m2_2024 = m2Statements.filter(s => s.includes("'2024'")).length;
    const m2_2023 = m2Statements.filter(s => s.includes("'2023'")).length;
    
    console.log("\nNWSM M1 (ENT):");
    console.log(`  Total: ${m1Statements.length} questions`);
    console.log(`  2025: ${m1_2025} questions`);
    console.log(`  2024: ${m1_2024} questions`);
    console.log(`  2023: ${m1_2023} questions`);
    
    console.log("\nNWSM M2 (Eye):");
    console.log(`  Total: ${m2Statements.length} questions`);
    console.log(`  2025: ${m2_2025} questions`);
    console.log(`  2024: ${m2_2024} questions`);
    console.log(`  2023: ${m2_2023} questions`);
    
    console.log("\n" + "=".repeat(70));
    console.log("SUMMARY");
    console.log("=".repeat(70));
    console.log(`Total NWSM M1+M2: ${m1Statements.length + m2Statements.length} questions`);
    console.log(`Total NWSM 2025: ${m1_2025 + m2_2025} questions`);
}

main();
