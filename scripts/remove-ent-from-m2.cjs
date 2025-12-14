/**
 * Remove ENT questions from M2 preproff files
 * M2 is supposed to be Eye (Ophthalmology), not ENT
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

// ENT-related subjects/topics to remove
const ENT_PATTERNS = [
    /'ENT'/i,
    /'Otology'/i,
    /'Rhinology'/i,
    /'Laryngology'/i,
    /'Ear, Nose/i,
    /'Middle Ear'/i,
    /'External Ear'/i,
    /'Inner Ear'/i,
    /Mastoiditis/i,
    /Otitis Media/i,
    /Otitis Externa/i,
    /Cholesteatoma/i,
    /Acoustic Neuroma/i,
    /Facial Nerve Palsy/i,
    /Laryngeal Carcinoma/i,
    /Meniere/i,
    /Cochlear Implant/i,
    /Myringoplasty/i,
    /Mastoidectomy/i,
    /Laryngomalacia/i,
    /Tracheo(s|t)omy/i,
    /Nasal Polyp/i,
    /Sinusitis/i,
    /Rhinosinusitis/i,
    /Angiofibroma/i,
    /Eustachian/i,
    /BPPV/i,
    /Vertigo/i,
    /Hearing Loss/i,
    /Deafness/i,
    /Noise.?Induced/i,
    /Glue Ear/i,
    /Diphtheria/i,
    /Wegener/i,
    /CSF Rhinorrhea/i,
    /Samter/i,
    /Sinonasal/i,
    /Tympanic/i,
];

function isENTQuestion(insertStatement) {
    // Check if this is an ENT subject
    if (insertStatement.includes("'ENT'") || insertStatement.includes(",'ENT',")) {
        return true;
    }
    
    // Check for ENT topics in the topic field or question text
    for (const pattern of ENT_PATTERNS) {
        if (pattern.test(insertStatement)) {
            return true;
        }
    }
    
    return false;
}

function processFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`\n=== Processing ${fileName} ===\n`);
    
    const encBuffer = fs.readFileSync(filePath);
    const content = decrypt(encBuffer);
    
    // Split into lines/statements
    const lines = content.split('\n');
    const insertLines = lines.filter(l => l.includes('INSERT INTO preproff') || l.includes('INSERT OR REPLACE INTO preproff'));
    const otherLines = lines.filter(l => !l.includes('INSERT INTO preproff') && !l.includes('INSERT OR REPLACE INTO preproff') && l.trim().length > 0);
    
    console.log(`Total questions: ${insertLines.length}`);
    
    // Filter out ENT questions
    const eyeQuestions = [];
    const entQuestions = [];
    
    for (const line of insertLines) {
        if (isENTQuestion(line)) {
            entQuestions.push(line);
        } else {
            eyeQuestions.push(line);
        }
    }
    
    console.log(`Eye questions (keeping): ${eyeQuestions.length}`);
    console.log(`ENT questions (removing): ${entQuestions.length}`);
    
    if (entQuestions.length > 0) {
        // Rebuild content with only Eye questions
        const newContent = [...otherLines, ...eyeQuestions].join('\n') + '\n';
        
        // Backup and save
        fs.copyFileSync(filePath, filePath + '.backup_ent_removal');
        fs.writeFileSync(filePath, encrypt(newContent));
        console.log(`✅ Saved (removed ${entQuestions.length} ENT questions)`);
        
        return { file: fileName, removed: entQuestions.length, remaining: eyeQuestions.length };
    } else {
        console.log('No ENT questions found');
        return { file: fileName, removed: 0, remaining: eyeQuestions.length };
    }
}

function main() {
    console.log("=".repeat(70));
    console.log("REMOVING ENT QUESTIONS FROM M2 PREPROFF FILES");
    console.log("=".repeat(70));
    
    const qbanksDir = path.join(__dirname, '..', 'public', 'qbanks');
    const m2Files = fs.readdirSync(qbanksDir).filter(f => f.includes('M2') && f.endsWith('.enc'));
    
    const results = [];
    
    for (const file of m2Files) {
        const result = processFile(path.join(qbanksDir, file));
        results.push(result);
    }
    
    console.log("\n" + "=".repeat(70));
    console.log("SUMMARY");
    console.log("=".repeat(70));
    
    let totalRemoved = 0;
    let totalRemaining = 0;
    
    for (const r of results) {
        console.log(`${r.file}: ${r.remaining} Eye questions, ${r.removed} ENT removed`);
        totalRemoved += r.removed;
        totalRemaining += r.remaining;
    }
    
    console.log(`\nTotal: ${totalRemaining} Eye questions remain, ${totalRemoved} ENT questions removed`);
}

main();
