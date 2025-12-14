/**
 * Find ENT questions in M2 preproff files
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

// ENT-related keywords
const ENT_KEYWORDS = [
    'Mastoiditis', 'mastoid',
    'Otitis Media', 'otitis media', 'otitis externa',
    'Cholesteatoma', 'cholesteatoma',
    'Acoustic Neuroma', 'acoustic neuroma',
    'Facial Nerve', 'facial nerve', 'Bell',
    'Laryngeal', 'laryngeal', 'larynx',
    'Hearing Loss', 'hearing loss', 'deafness',
    'Vertigo', 'BPPV', 'vestibular',
    'Tracheostomy', 'tracheostomy',
    'Diphtheria', 'diphtheria',
    'Meniere', 'meniere',
    'Cochlear', 'cochlear',
    'CSF Rhinorrhea', 'rhinorrhea',
    'Angiofibroma', 'angiofibroma',
    'Eustachian', 'eustachian',
    'Myringoplasty', 'myringoplasty',
    'Nasal Polyp', 'nasal polyp',
    'Rhinosinusitis', 'sinusitis',
    'Glue Ear', 'glue ear',
    'Laryngomalacia', 'laryngomalacia',
    'Noise Induced', 'noise-induced',
    'Sinonasal', 'sinonasal',
    'Amphotericin', 'amphotericin',
    'Samter', 'samter',
    'Wegener', 'wegener',
    'ENT', 'Otology', 'Rhinology', 'Laryngology',
    'tympanic', 'Tympanic',
    'Middle Ear', 'middle ear',
    'Inner Ear', 'inner ear',
    'External Ear', 'external ear'
];

function main() {
    const qbanksDir = path.join(__dirname, '..', 'public', 'qbanks');
    const m2Files = fs.readdirSync(qbanksDir).filter(f => f.includes('M2') && f.endsWith('.enc'));
    
    console.log("=".repeat(70));
    console.log("SEARCHING FOR ENT QUESTIONS IN M2 PREPROFF FILES");
    console.log("=".repeat(70));
    
    for (const file of m2Files) {
        console.log(`\n=== ${file} ===\n`);
        
        const filePath = path.join(qbanksDir, file);
        const encBuffer = fs.readFileSync(filePath);
        const content = decrypt(encBuffer);
        
        // Split into questions
        const questions = content.split(/INSERT INTO preproff|INSERT OR REPLACE INTO preproff/).slice(1);
        
        let entCount = 0;
        const entQuestions = [];
        
        questions.forEach((q, idx) => {
            // Check for ENT keywords
            for (const keyword of ENT_KEYWORDS) {
                if (q.toLowerCase().includes(keyword.toLowerCase())) {
                    entCount++;
                    // Extract question text
                    const qMatch = q.match(/VALUES \([^,]+, '[^']+', '[^']+', '([^']{0,100})/);
                    entQuestions.push({
                        index: idx + 1,
                        keyword: keyword,
                        snippet: qMatch ? qMatch[1] : q.substring(0, 80)
                    });
                    break; // Only count once per question
                }
            }
        });
        
        console.log(`Total questions: ${questions.length}`);
        console.log(`ENT-related found: ${entCount}`);
        
        if (entQuestions.length > 0) {
            console.log('\nENT Questions:');
            entQuestions.forEach(eq => {
                console.log(`  Q${eq.index}: [${eq.keyword}] ${eq.snippet}...`);
            });
        }
    }
}

main();
