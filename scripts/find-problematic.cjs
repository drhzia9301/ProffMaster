/**
 * COMPREHENSIVE ABNORMAL EXPLANATION FINDER
 * Finds all questions with AI "thinking aloud" patterns and generates a report
 */

const fs = require('fs');
const path = require('path');

const ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025";

// Patterns that indicate AI "thinking aloud"
const PROBLEMATIC_PATTERNS = [
    { regex: /\bWait,/gi, name: "Wait," },
    { regex: /\bActually,/gi, name: "Actually," },
    { regex: /\bLet me re-?evaluate/gi, name: "Let me re-evaluate" },
    { regex: /\bLet's re-?evaluate/gi, name: "Let's re-evaluate" },
    { regex: /\bIs there a better option/gi, name: "Is there a better option" },
    { regex: /\bthe question implies/gi, name: "the question implies" },
    { regex: /\bthis might be tricky/gi, name: "this might be tricky" },
    { regex: /\bHowever,?\s+newer sources/gi, name: "However, newer sources" },
    { regex: /\bHence \w+ is the relative/gi, name: "Hence X is the relative" },
    { regex: /\bBut if we must choose/gi, name: "But if we must choose" },
    { regex: /\bMaybe '\w+'/gi, name: "Maybe 'X'" },
    { regex: /\bIf forced to/gi, name: "If forced to" },
    { regex: /\bLet's assume/gi, name: "Let's assume" },
    { regex: /\bLet's check/gi, name: "Let's check" },
    { regex: /\bLooking at the provided options/gi, name: "Looking at the provided options" },
    { regex: /\bAssuming the question/gi, name: "Assuming the question" },
    { regex: /\bGiven options,/gi, name: "Given options," },
    { regex: /\bIf the key marks/gi, name: "If the key marks" },
    { regex: /\bBetween these,/gi, name: "Between these," },
    { regex: /\bUsually,?\s+in.*MCQs/gi, name: "Usually in MCQs" },
];

function decryptFile(encryptedBuffer) {
    const keyBytes = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    const decryptedBytes = Buffer.alloc(encryptedBuffer.length);
    for (let i = 0; i < encryptedBuffer.length; i++) {
        decryptedBytes[i] = encryptedBuffer[i] ^ keyBytes[i % keyBytes.length];
    }
    return decryptedBytes.toString('utf-8');
}

function parseInsertValues(str) {
    const values = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';
    let i = 0;
    
    while (i < str.length) {
        const char = str[i];
        if ((char === "'" || char === '"') && !inQuote) {
            inQuote = true;
            quoteChar = char;
            i++;
            continue;
        }
        if (char === quoteChar && inQuote) {
            if (str[i + 1] === quoteChar) {
                current += char;
                i += 2;
                continue;
            }
            inQuote = false;
            i++;
            continue;
        }
        if (char === ',' && !inQuote) {
            values.push(current.trim());
            current = '';
            i++;
            continue;
        }
        current += char;
        i++;
    }
    if (current) {
        values.push(current.trim());
    }
    return values;
}

function parseQuestions(decryptedText, fileName) {
    let questions = [];
    
    // Try JSON first
    try {
        const parsed = JSON.parse(decryptedText);
        questions = Array.isArray(parsed) ? parsed.flat() : [parsed];
        questions = questions.map((q, i) => ({
            ...q,
            sourceIndex: i,
            sourceFile: fileName,
            format: 'json'
        }));
        return questions;
    } catch (e) {}
    
    // Try SQL - preproff table format
    if (decryptedText.includes('INSERT INTO preproff')) {
        const insertRegex = /INSERT\s+INTO\s+preproff\s*\([^)]+\)\s*VALUES\s*\((.+?)\)(?:;|$|\r?\nINSERT)/gi;
        let match;
        let idx = 0;
        
        while ((match = insertRegex.exec(decryptedText)) !== null) {
            try {
                const values = parseInsertValues(match[1]);
                if (values.length >= 4) {
                    questions.push({
                        text: values[0],
                        options: values[1],
                        correctIndex: parseInt(values[2]) || 0,
                        explanation: values[3],
                        year: values[9] || 'Unknown',
                        sourceIndex: idx,
                        sourceFile: fileName,
                        format: 'sql-preproff'
                    });
                    idx++;
                }
            } catch(e) {}
        }
        return questions;
    }
    
    // Try SQL - questions table format (for initial_db.enc)
    if (decryptedText.includes('INSERT') && decryptedText.includes('INTO questions')) {
        const insertRegex = /INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+questions\s*\([^)]+\)\s*VALUES\s*\((.+?)\)(?:;|$|\r?\nINSERT)/gi;
        let match;
        let idx = 0;
        
        while ((match = insertRegex.exec(decryptedText)) !== null) {
            try {
                const values = parseInsertValues(match[1]);
                // id, subject, topic, question, options, correct_answer, correct_index, explanation, difficulty
                if (values.length >= 8) {
                    questions.push({
                        id: values[0],
                        subject: values[1],
                        text: values[3],
                        options: values[4],
                        correctIndex: parseInt(values[6]) || 0,
                        explanation: values[7],
                        sourceIndex: idx,
                        sourceFile: fileName,
                        format: 'sql-questions'
                    });
                    idx++;
                }
            } catch(e) {}
        }
        return questions;
    }
    
    return questions;
}

function findProblematicPatterns(explanation) {
    if (!explanation) return [];
    
    const found = [];
    for (const pattern of PROBLEMATIC_PATTERNS) {
        const matches = explanation.match(pattern.regex);
        if (matches) {
            found.push({ name: pattern.name, count: matches.length });
        }
    }
    return found;
}

function main() {
    const qbanksDir = path.join(__dirname, '..', 'public', 'qbanks');
    const assetsDir = path.join(__dirname, '..', 'public', 'assets');
    
    console.log('=' .repeat(70));
    console.log('🔍 COMPREHENSIVE ABNORMAL EXPLANATION FINDER');
    console.log('=' .repeat(70));
    
    const allProblematic = [];
    
    // Scan qbanks files
    const qbankFiles = fs.readdirSync(qbanksDir).filter(f => f.endsWith('.enc'));
    console.log(`\nScanning ${qbankFiles.length} preproff files...`);
    
    for (const file of qbankFiles) {
        const filePath = path.join(qbanksDir, file);
        const encryptedBuffer = fs.readFileSync(filePath);
        const decryptedText = decryptFile(encryptedBuffer);
        const questions = parseQuestions(decryptedText, file);
        
        for (const q of questions) {
            const patterns = findProblematicPatterns(q.explanation);
            if (patterns.length > 0) {
                allProblematic.push({
                    file: q.sourceFile,
                    index: q.sourceIndex,
                    format: q.format,
                    id: q.id || null,
                    questionPreview: (q.text || '').substring(0, 100),
                    explanation: q.explanation,
                    patterns: patterns
                });
            }
        }
    }
    
    // Scan initial_db.enc
    const initialDbPath = path.join(assetsDir, 'initial_db.enc');
    if (fs.existsSync(initialDbPath)) {
        console.log('Scanning initial_db.enc...');
        const encryptedBuffer = fs.readFileSync(initialDbPath);
        const decryptedText = decryptFile(encryptedBuffer);
        const questions = parseQuestions(decryptedText, 'initial_db.enc');
        
        console.log(`  Found ${questions.length} questions in initial_db.enc`);
        
        for (const q of questions) {
            const patterns = findProblematicPatterns(q.explanation);
            if (patterns.length > 0) {
                allProblematic.push({
                    file: q.sourceFile,
                    index: q.sourceIndex,
                    format: q.format,
                    id: q.id || null,
                    subject: q.subject || null,
                    questionPreview: (q.text || '').substring(0, 100),
                    explanation: q.explanation,
                    patterns: patterns
                });
            }
        }
    }
    
    // Report
    console.log('\n' + '=' .repeat(70));
    console.log(`📊 FOUND ${allProblematic.length} PROBLEMATIC EXPLANATIONS`);
    console.log('=' .repeat(70));
    
    if (allProblematic.length > 0) {
        // Group by file
        const byFile = {};
        for (const item of allProblematic) {
            if (!byFile[item.file]) byFile[item.file] = [];
            byFile[item.file].push(item);
        }
        
        console.log('\n📋 BREAKDOWN BY FILE:');
        for (const [file, items] of Object.entries(byFile)) {
            console.log(`  ${file}: ${items.length} problematic`);
        }
        
        // Show details
        console.log('\n📝 DETAILED LIST:');
        console.log('-' .repeat(70));
        
        for (let i = 0; i < allProblematic.length; i++) {
            const item = allProblematic[i];
            console.log(`\n[${i + 1}] File: ${item.file}`);
            console.log(`    Index: ${item.index} | Format: ${item.format}`);
            if (item.id) console.log(`    ID: ${item.id}`);
            if (item.subject) console.log(`    Subject: ${item.subject}`);
            console.log(`    Patterns: ${item.patterns.map(p => p.name).join(', ')}`);
            console.log(`    Question: ${item.questionPreview}...`);
            console.log(`    Explanation (${item.explanation.length} chars):`);
            console.log(`      ${item.explanation.substring(0, 300)}...`);
            console.log('-' .repeat(70));
        }
        
        // Save report
        const reportPath = path.join(__dirname, 'problematic-explanations.json');
        fs.writeFileSync(reportPath, JSON.stringify(allProblematic, null, 2));
        console.log(`\n💾 Full report saved to: ${reportPath}`);
    }
}

main();
