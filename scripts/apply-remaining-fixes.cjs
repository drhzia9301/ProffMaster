/**
 * Apply remaining fixes directly
 * These are the 7 questions that still have problematic patterns
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

// Remaining fixes with the exact old explanations for search/replace
const REMAINING_FIXES = [
    // kmc L.enc - index 152 (actually wasn't fully applied because old explanation didn't match)
    {
        file: 'kmc L.enc',
        searchPartial: "if we must choose from the homicide categories",
        newExplanation: "Causing miscarriage is classified under 'Isqat-i-Haml' in Pakistan Penal Code (PPC). This is a specific offense distinct from the categories of homicide (Qatl). If the options only include homicide categories, Qatl-i-khata (killing by mistake) may be selected for unintentional fetal death during medical procedures."
    },
    // kmc L.enc - index 198
    {
        file: 'kmc L.enc',
        searchPartial: "If the question implies granular",
        newExplanation: "The clinical presentation (flank mass, hematuria, weight loss, fever) describes the classic triad of renal cell carcinoma. 'Conventional carcinoma' refers to clear cell RCC, the most common malignant renal tumor (70-80% of cases). Clear cell RCC typically shows cells with abundant clear cytoplasm due to lipid and glycogen content."
    },
    // kmc L.enc - index 152 (endometrial)
    {
        file: 'kmc L.enc',
        searchPartial: "If forced to choose an imaging modality",
        newExplanation: "Endometrial cancer staging is surgical (FIGO). Pre-operative imaging for local staging includes MRI (best for myometrial invasion assessment) or transvaginal ultrasound. Chest X-ray screens for pulmonary metastases. Endometrial biopsy confirms the diagnosis but does not assess extent."
    },
    // initial_db.enc - pharmacology_974
    {
        file: 'initial_db.enc',
        searchPartial: "Let's check standard keys",
        id: 'pharmacology_974',
        newExplanation: "Bupivacaine is highly lipid-soluble and protein-bound, resulting in inherently long duration of action. Adding vasoconstrictors (epinephrine) provides less proportional benefit compared to short-acting agents like lidocaine. The drug's pharmacokinetic properties already provide prolonged tissue binding."
    },
    // initial_db.enc - surgery_1979
    {
        file: 'initial_db.enc',
        searchPartial: "Between these, Estrogen-induced pancreatitis",
        id: 'surgery_1979',
        newExplanation: "An obese female on oral contraceptives has multiple risk factors for both gallstones (obesity, female, estrogen) and pancreatitis (hypertriglyceridemia from estrogen). Epigastric pain with radiation to the back favors pancreatitis. Estrogen-induced hypertriglyceridemia is a known cause of acute pancreatitis."
    },
    // initial_db.enc - surgery_2038
    {
        file: 'initial_db.enc',
        searchPartial: "Assuming the question asks about GB anomalies",
        id: 'surgery_2038',
        newExplanation: "Congenital gallbladder anomalies include: Phrygian cap (folded fundus), floating gallbladder (complete peritoneal covering), double gallbladder, agenesis, and intrahepatic gallbladder. High insertion of the cystic duct is a ductal variation rather than a gallbladder anomaly per se."
    },
    // initial_db.enc - surgery_2088
    {
        file: 'initial_db.enc',
        searchPartial: "Let's assume 'Large bowel obstruction'",
        id: 'surgery_2088',
        newExplanation: "In a 60-year-old with lower abdominal pain, distention, and hyperactive bowel sounds, large bowel obstruction is likely. Common causes include colorectal carcinoma and sigmoid volvulus. Marked vomiting is typically an early feature of small bowel obstruction but occurs late in large bowel obstruction. Massive abdominal distention favors sigmoid volvulus."
    }
];

function escapeForSql(str) {
    return str.replace(/'/g, "''");
}

function applyRemainingFixes() {
    console.log('=' .repeat(70));
    console.log('🔧 APPLYING REMAINING FIXES');
    console.log('=' .repeat(70));
    
    // Group by file
    const byFile = {};
    for (const fix of REMAINING_FIXES) {
        if (!byFile[fix.file]) byFile[fix.file] = [];
        byFile[fix.file].push(fix);
    }
    
    let totalFixed = 0;
    
    for (const [fileName, fixes] of Object.entries(byFile)) {
        console.log(`\n📂 Processing: ${fileName}`);
        
        let filePath;
        if (fileName === 'initial_db.enc') {
            filePath = path.join(__dirname, '..', 'public', 'assets', fileName);
        } else {
            filePath = path.join(__dirname, '..', 'public', 'qbanks', fileName);
        }
        
        if (!fs.existsSync(filePath)) {
            console.log(`   ⚠️ File not found`);
            continue;
        }
        
        const encryptedBuffer = fs.readFileSync(filePath);
        let content = decrypt(encryptedBuffer);
        let fixesApplied = 0;
        
        for (const fix of fixes) {
            const searchPartial = fix.searchPartial;
            const newExplanation = escapeForSql(fix.newExplanation);
            
            // Find the position of the search partial
            const partialIndex = content.indexOf(searchPartial);
            
            if (partialIndex === -1) {
                console.log(`   ⚠️ Pattern not found: "${searchPartial.substring(0, 40)}..."`);
                continue;
            }
            
            // Find the start and end of this explanation string
            // Look backwards for the opening quote
            let explStart = partialIndex;
            while (explStart > 0 && content[explStart] !== "'") {
                explStart--;
            }
            explStart++; // Move past the quote
            
            // Look forward for the closing quote (handling escaped quotes)
            let explEnd = partialIndex;
            let foundEnd = false;
            while (explEnd < content.length && !foundEnd) {
                if (content[explEnd] === "'") {
                    // Check if it's an escaped quote
                    if (content[explEnd + 1] === "'") {
                        explEnd += 2;
                        continue;
                    }
                    foundEnd = true;
                } else {
                    explEnd++;
                }
            }
            
            if (!foundEnd) {
                console.log(`   ⚠️ Could not find explanation end for: ${fix.id || fix.searchPartial.substring(0, 30)}`);
                continue;
            }
            
            const oldExplanation = content.substring(explStart, explEnd);
            
            // Replace
            content = content.substring(0, explStart) + newExplanation + content.substring(explEnd);
            
            fixesApplied++;
            console.log(`   ✅ Fixed: ${fix.id || 'index ' + fix.searchPartial.substring(0, 30)}`);
        }
        
        if (fixesApplied > 0) {
            const encryptedContent = encrypt(content);
            fs.writeFileSync(filePath, encryptedContent);
            console.log(`   💾 Saved: ${fileName} (${fixesApplied} fixes)`);
            totalFixed += fixesApplied;
        }
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log(`📊 Total remaining fixes applied: ${totalFixed}/${REMAINING_FIXES.length}`);
}

applyRemainingFixes();
