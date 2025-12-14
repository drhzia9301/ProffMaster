/**
 * Swap misplaced questions between M1 (ENT) and M2 (Eye) preproff files
 * 1. Move ENT questions from M2 files to corresponding M1 files
 * 2. Move Eye questions from M1 files to corresponding M2 files
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

// ENT-related patterns (for M2 -> M1 transfer)
const ENT_PATTERNS = [
    /'ENT'/i,
    /Mastoiditis/i,
    /Otitis Media/i,
    /Otitis Externa/i,
    /Cholesteatoma/i,
    /Acoustic Neuroma/i,
    /Facial Nerve Palsy/i,
    /Laryngeal/i,
    /Meniere/i,
    /Cochlear/i,
    /Myringoplasty/i,
    /Mastoidectomy/i,
    /Laryngomalacia/i,
    /Tracheostomy/i,
    /Nasal Polyp/i,
    /Sinusitis/i,
    /Rhinosinusitis/i,
    /Angiofibroma/i,
    /Eustachian/i,
    /BPPV/i,
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
    /Middle Ear/i,
    /External Ear/i,
    /Inner Ear/i,
];

// Eye-related patterns (for M1 -> M2 transfer)
const EYE_PATTERNS = [
    /'Ophthalmology'/i,
    /Chalazion/i,
    /Stye/i,
    /Hordeolum/i,
    /Orbital Cellulitis/i,
    /Preseptal Cellulitis/i,
    /Xanthelasma/i,
    /Ectropion/i,
    /Entropion/i,
    /Ptosis/i,
    /Esotropia/i,
    /Exotropia/i,
    /Retinoblastoma/i,
    /Leukocoria/i,
    /Congenital Cataract/i,
    /Lensectomy/i,
    /Myasthenia Gravis/i,
    /Nerve Palsy.*eye/i,
    /eye.*Nerve Palsy/i,
    /Proptosis/i,
    /Squint/i,
    /Strabismus/i,
    /Amblyopia/i,
    /Lazy eye/i,
    /lid/i,
    /eyelid/i,
    /orbit/i,
    /cornea/i,
    /retina/i,
    /cataract/i,
    /glaucoma/i,
    /vision/i,
    /visual acuity/i,
    /ocular/i,
];

function isENTQuestion(line) {
    if (line.includes("'ENT'") || line.includes(",'ENT',")) return true;
    for (const pattern of ENT_PATTERNS) {
        if (pattern.test(line)) return true;
    }
    return false;
}

function isEyeQuestion(line) {
    if (line.includes("'Ophthalmology'") || line.includes(",'Ophthalmology',")) return true;
    for (const pattern of EYE_PATTERNS) {
        if (pattern.test(line)) return true;
    }
    return false;
}

function getInsertLines(content) {
    return content.split('\n').filter(l => 
        l.includes('INSERT INTO preproff') || l.includes('INSERT OR REPLACE INTO preproff')
    );
}

const qbanksDir = path.join(__dirname, '..', 'public', 'qbanks');

function main() {
    console.log("=".repeat(70));
    console.log("SWAPPING M1 <-> M2 MISPLACED QUESTIONS");
    console.log("=".repeat(70));
    
    const colleges = ['gmc', 'kgmc', 'kmc', 'nwsm', 'wmc'];
    
    let totalEyeToM2 = 0;
    let totalENTToM1 = 0;
    
    for (const college of colleges) {
        const m1File = path.join(qbanksDir, `${college} M1.enc`);
        const m2File = path.join(qbanksDir, `${college} M2.enc`);
        
        if (!fs.existsSync(m1File) || !fs.existsSync(m2File)) {
            console.log(`\nSkipping ${college} - missing files`);
            continue;
        }
        
        console.log(`\n=== ${college.toUpperCase()} ===`);
        
        // Load both files
        const m1Content = decrypt(fs.readFileSync(m1File));
        const m2Content = decrypt(fs.readFileSync(m2File));
        
        const m1Lines = getInsertLines(m1Content);
        const m2Lines = getInsertLines(m2Content);
        
        console.log(`M1 (ENT): ${m1Lines.length} questions`);
        console.log(`M2 (Eye): ${m2Lines.length} questions`);
        
        // Find Eye questions in M1 (should move to M2)
        const eyeInM1 = m1Lines.filter(l => isEyeQuestion(l) && !isENTQuestion(l));
        const entInM1 = m1Lines.filter(l => !isEyeQuestion(l) || isENTQuestion(l));
        
        // Find ENT questions in M2 (should move to M1) - from backups
        const m2BackupFile = m2File + '.backup_ent_removal';
        let entInM2 = [];
        if (fs.existsSync(m2BackupFile)) {
            const m2BackupContent = decrypt(fs.readFileSync(m2BackupFile));
            const m2BackupLines = getInsertLines(m2BackupContent);
            entInM2 = m2BackupLines.filter(l => isENTQuestion(l));
        }
        
        console.log(`  Eye questions in M1 to move to M2: ${eyeInM1.length}`);
        console.log(`  ENT questions from M2 backup to add to M1: ${entInM2.length}`);
        
        // Build new M1: keep ENT, add ENT from M2, remove Eye
        const newM1Lines = [...entInM1, ...entInM2];
        
        // Build new M2: current M2 + Eye from M1
        const newM2Lines = [...m2Lines, ...eyeInM1];
        
        console.log(`  New M1: ${newM1Lines.length} questions`);
        console.log(`  New M2: ${newM2Lines.length} questions`);
        
        // Save
        if (eyeInM1.length > 0 || entInM2.length > 0) {
            fs.writeFileSync(m1File, encrypt(newM1Lines.join('\n') + '\n'));
            fs.writeFileSync(m2File, encrypt(newM2Lines.join('\n') + '\n'));
            console.log(`  ✅ Saved both files`);
            
            totalEyeToM2 += eyeInM1.length;
            totalENTToM1 += entInM2.length;
        }
    }
    
    console.log("\n" + "=".repeat(70));
    console.log("SUMMARY");
    console.log("=".repeat(70));
    console.log(`Eye questions moved from M1 to M2: ${totalEyeToM2}`);
    console.log(`ENT questions moved from M2 backup to M1: ${totalENTToM1}`);
}

main();
