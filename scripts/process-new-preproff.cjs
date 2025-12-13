/**
 * Script to process new preproff JSON files and create/update encrypted .enc files
 * for the ProffMaster application.
 * 
 * Usage: node scripts/process-new-preproff.cjs
 */

const fs = require('fs');
const path = require('path');

// Configuration
const NEW_FILES_DIR = path.join(__dirname, '..', 'new');
const QBANKS_DIR = path.join(__dirname, '..', 'public', 'qbanks');
const ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025";

// XOR Encryption (same as in databaseService.ts)
function encrypt(data) {
    const keyBytes = Buffer.from(ENCRYPTION_KEY, 'utf8');
    const dataBytes = Buffer.from(data, 'utf8');
    const encrypted = Buffer.alloc(dataBytes.length);
    
    for (let i = 0; i < dataBytes.length; i++) {
        encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return encrypted;
}

function decrypt(encryptedBuffer) {
    const keyBytes = Buffer.from(ENCRYPTION_KEY, 'utf8');
    const decrypted = Buffer.alloc(encryptedBuffer.length);
    
    for (let i = 0; i < encryptedBuffer.length; i++) {
        decrypted[i] = encryptedBuffer[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return decrypted.toString('utf8');
}

// Parse filename to extract metadata
function parseFilename(filename) {
    // Examples:
    // "1. BLOCK M1 AMC TMM US.txt" -> block:M1, college:AMC
    // "2.BLOCK J GMC 2024.txt" -> block:J, college:GMC
    // "4.BLOCK J KIMS 2023.txt" -> block:J, college:KIMS
    // "7. BLOCK ENT NWSM 2023 TMM US.txt" -> block:M1 (ENT is part of M1)
    
    const match = filename.match(/BLOCK\s*(\w+)\s+(\w+)/i);
    if (match) {
        let block = match[1].toUpperCase();
        const college = match[2].toUpperCase();
        
        // ENT is part of M1 block, Eye is part of M2
        if (block === 'ENT') {
            block = 'M1';
        } else if (block === 'EYE') {
            block = 'M2';
        }
        
        return {
            block: block,
            college: college
        };
    }
    return null;
}

// Load existing encrypted file if it exists
function loadExistingData(encFilePath) {
    if (fs.existsSync(encFilePath)) {
        const encryptedData = fs.readFileSync(encFilePath);
        const decrypted = decrypt(encryptedData);
        try {
            const parsed = JSON.parse(decrypted);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            console.log(`  Warning: Existing data is not an array, starting fresh`);
            return [];
        } catch (e) {
            console.log(`  Warning: Could not parse existing file (${e.message}), starting fresh`);
            return [];
        }
    }
    return [];
}

// Main processing function
function processNewFiles() {
    console.log('=== Processing New Preproff Files ===\n');
    
    // Ensure qbanks directory exists
    if (!fs.existsSync(QBANKS_DIR)) {
        fs.mkdirSync(QBANKS_DIR, { recursive: true });
    }
    
    // Get all txt files in new directory
    const files = fs.readdirSync(NEW_FILES_DIR).filter(f => f.endsWith('.txt'));
    console.log(`Found ${files.length} files to process\n`);
    
    // Group files by college and block
    const filesByTarget = {};
    
    for (const file of files) {
        const parsed = parseFilename(file);
        if (!parsed) {
            console.log(`  Skipping ${file} - could not parse filename`);
            continue;
        }
        
        const key = `${parsed.college.toLowerCase()} ${parsed.block}`;
        if (!filesByTarget[key]) {
            filesByTarget[key] = [];
        }
        filesByTarget[key].push(file);
    }
    
    // Process each target (college+block combination)
    const stats = {
        newFiles: 0,
        updatedFiles: 0,
        totalQuestions: 0
    };
    
    for (const [targetKey, sourceFiles] of Object.entries(filesByTarget)) {
        const encFilename = `${targetKey}.enc`;
        const encFilePath = path.join(QBANKS_DIR, encFilename);
        
        console.log(`Processing: ${targetKey}`);
        console.log(`  Source files: ${sourceFiles.join(', ')}`);
        
        // Check if file exists but might be corrupted (try to detect by checking backup)
        const backupPath = encFilePath + '.backup';
        let existingData = [];
        let isNew = true;
        
        // If backup exists and main file exists, prefer backup for merging
        if (fs.existsSync(backupPath)) {
            console.log(`  Found backup file, attempting to load...`);
            existingData = loadExistingData(backupPath);
            if (existingData.length > 0) {
                isNew = false;
                console.log(`  Loaded ${existingData.length} existing questions from backup`);
            }
        } else if (fs.existsSync(encFilePath)) {
            existingData = loadExistingData(encFilePath);
            if (existingData.length > 0) {
                isNew = false;
                console.log(`  Loaded ${existingData.length} existing questions`);
            }
        }
        
        if (isNew) {
            console.log(`  Creating new file (no existing data found)`);
        }
        
        // Load and merge new data from all source files
        let newQuestions = [];
        for (const sourceFile of sourceFiles) {
            const filePath = path.join(NEW_FILES_DIR, sourceFile);
            const content = fs.readFileSync(filePath, 'utf8');
            
            try {
                const questions = JSON.parse(content);
                if (Array.isArray(questions)) {
                    newQuestions = newQuestions.concat(questions);
                    console.log(`  Loaded ${questions.length} questions from ${sourceFile}`);
                }
            } catch (e) {
                console.log(`  Error parsing ${sourceFile}: ${e.message}`);
            }
        }
        
        // Merge: Add new questions, avoiding duplicates based on question text
        const existingTexts = new Set(
            existingData.map(q => (q.question || q.text || '').toLowerCase().trim().substring(0, 100))
        );
        let added = 0;
        
        for (const q of newQuestions) {
            const qText = (q.question || q.text || '').toLowerCase().trim().substring(0, 100);
            if (!existingTexts.has(qText) && qText.length > 0) {
                existingData.push(q);
                existingTexts.add(qText);
                added++;
            }
        }
        
        console.log(`  New questions added: ${added}`);
        console.log(`  Total questions: ${existingData.length}`);
        
        // Encrypt and save
        const jsonData = JSON.stringify(existingData, null, 2);
        const encrypted = encrypt(jsonData);
        fs.writeFileSync(encFilePath, encrypted);
        console.log(`  Saved to: ${encFilename}`);
        console.log('');
        
        if (isNew) stats.newFiles++;
        else stats.updatedFiles++;
        stats.totalQuestions += added;
    }
    
    console.log('\n=== Summary ===');
    console.log(`New .enc files created: ${stats.newFiles}`);
    console.log(`Existing .enc files updated: ${stats.updatedFiles}`);
    console.log(`Total new questions added: ${stats.totalQuestions}`);
    
    // List all enc files for verification
    console.log('\n=== Current .enc files ===');
    const encFiles = fs.readdirSync(QBANKS_DIR).filter(f => f.endsWith('.enc') && !f.includes('.backup'));
    encFiles.sort();
    for (const f of encFiles) {
        const fstats = fs.statSync(path.join(QBANKS_DIR, f));
        console.log(`  ${f} (${(fstats.size / 1024).toFixed(1)} KB)`);
    }
}

// Run
processNewFiles();
