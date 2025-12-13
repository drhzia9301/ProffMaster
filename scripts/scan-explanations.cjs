/**
 * Script to scan for abnormally long AI-generated explanations
 * in the encrypted question bank files.
 * 
 * Usage: node scripts/scan-explanations.cjs
 */

const fs = require('fs');
const path = require('path');

// Decryption key (same as in databaseService.ts)
const ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025";

// Thresholds for detecting abnormal explanations
const ABNORMAL_LENGTH_THRESHOLD = 500; // Characters - explanations longer than this are flagged
const AI_THINKING_PATTERNS = [
    /\bWait,?\s/gi,
    /\bActually,?\s/gi,
    /\bLet me\s/gi,
    /\bLet's\s/gi,
    /\bIs there a better/gi,
    /\bIf we must choose/gi,
    /\bBut if\s/gi,
    /\bre-evaluate/gi,
    /\bthis might be tricky/gi,
    /\bthe question implies/gi,
    /\bHowever,?\s+newer sources/gi,
    /\bHence\s+\w+\s+is the relative/gi,
    /\?.*\?/g, // Multiple question marks (AI asking itself questions)
];

function decryptFile(encryptedBuffer) {
    const keyBytes = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    const decryptedBytes = Buffer.alloc(encryptedBuffer.length);
    
    for (let i = 0; i < encryptedBuffer.length; i++) {
        decryptedBytes[i] = encryptedBuffer[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return decryptedBytes.toString('utf-8');
}

function countAIPatterns(text) {
    let count = 0;
    for (const pattern of AI_THINKING_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            count += matches.length;
        }
    }
    return count;
}

function analyzeExplanation(explanation) {
    if (!explanation) return { isAbnormal: false };
    
    const length = explanation.length;
    const patternCount = countAIPatterns(explanation);
    const hasMultipleQuestions = (explanation.match(/\?/g) || []).length >= 3;
    
    // An explanation is abnormal if:
    // 1. It's very long (> threshold)
    // 2. AND it contains AI thinking patterns
    const isAbnormal = (length > ABNORMAL_LENGTH_THRESHOLD && patternCount >= 2) ||
                       (patternCount >= 3) ||
                       (length > 800 && hasMultipleQuestions);
    
    return {
        isAbnormal,
        length,
        patternCount,
        hasMultipleQuestions
    };
}

/**
 * Parse SQL INSERT statements to extract question data
 */
function parseSqlInserts(sqlText) {
    const questions = [];
    
    // Match INSERT statements for preproff table
    // Format: INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES (...)
    const insertRegex = /INSERT\s+INTO\s+preproff\s*\([^)]+\)\s*VALUES\s*\((.+?)\)(?:;|$)/gi;
    let match;
    
    while ((match = insertRegex.exec(sqlText)) !== null) {
        try {
            const valuesStr = match[1];
            // Parse the values - they're comma separated but may contain quoted strings with commas
            const values = parseInsertValues(valuesStr);
            
            if (values.length >= 5) {
                questions.push({
                    id: values[0],
                    text: values[1],
                    options: values[2],
                    correctIndex: parseInt(values[3]) || 0,
                    explanation: values[4],
                    year: values[10] || 'Unknown'
                });
            }
        } catch(e) {
            // Skip malformed entries
        }
    }
    
    return questions;
}

/**
 * Parse comma-separated values handling quoted strings
 */
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
            // Check for escaped quote
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

/**
 * Parse SQL INSERT statements for the 'questions' table from initial_db.enc
 */
function parseQuestionsTableInserts(sqlText) {
    const questions = [];
    
    // Match INSERT statements for questions table
    // The format may vary, need to be flexible
    const insertRegex = /INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+questions\s*\([^)]+\)\s*VALUES\s*\((.+?)\)(?:;|$)/gi;
    let match;
    
    while ((match = insertRegex.exec(sqlText)) !== null) {
        try {
            const valuesStr = match[1];
            const values = parseInsertValues(valuesStr);
            
            // questions table has: id, subject, topic, question, options, correct_answer, correct_index, explanation
            if (values.length >= 8) {
                questions.push({
                    id: values[0],
                    subject: values[1],
                    text: values[3], // question text is at index 3
                    options: values[4],
                    explanation: values[7], // explanation is at index 7
                    year: 'main_db'
                });
            }
        } catch(e) {
            // Skip malformed entries
        }
    }
    
    return questions;
}

function scanQBankFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`\n📂 Scanning: ${fileName}`);
    
    try {
        const encryptedBuffer = fs.readFileSync(filePath);
        const decryptedText = decryptFile(encryptedBuffer);
        
        let questions = [];
        let format = 'unknown';
        
        // Try JSON first
        try {
            const parsed = JSON.parse(decryptedText);
            questions = Array.isArray(parsed) ? parsed.flat() : [parsed];
            format = 'json';
        } catch (e) {
            // Try SQL INSERT format
            if (decryptedText.includes('INSERT INTO')) {
                // Check which table type
                if (decryptedText.includes('INSERT INTO questions') || decryptedText.includes('INSERT OR REPLACE INTO questions')) {
                    questions = parseQuestionsTableInserts(decryptedText);
                    format = 'sql-questions';
                } else {
                    questions = parseSqlInserts(decryptedText);
                    format = 'sql-preproff';
                }
            }
        }
        
        if (questions.length === 0) {
            // Show a preview of the file content for debugging
            console.log(`   ⚠️ No questions parsed. Format: ${format}`);
            console.log(`   📄 First 200 chars: ${decryptedText.substring(0, 200).replace(/\n/g, ' ')}...`);
            return [];
        }
        
        const abnormalQuestions = [];
        
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q || !q.explanation) continue;
            
            const analysis = analyzeExplanation(q.explanation);
            
            if (analysis.isAbnormal) {
                abnormalQuestions.push({
                    file: fileName,
                    index: i,
                    year: q.year || 'Unknown',
                    questionPreview: (q.text || q.question || '').substring(0, 100) + '...',
                    explanation: q.explanation,
                    explanationLength: analysis.length,
                    patternCount: analysis.patternCount
                });
            }
        }
        
        console.log(`   ✅ Found ${questions.length} questions (${format}), ${abnormalQuestions.length} with abnormal explanations`);
        return abnormalQuestions;
        
    } catch (error) {
        console.error(`   ❌ Error reading ${fileName}:`, error.message);
        return [];
    }
}

function main() {
    console.log('=' .repeat(70));
    console.log('🔍 ABNORMAL EXPLANATION SCANNER');
    console.log('=' .repeat(70));
    console.log(`Length threshold: ${ABNORMAL_LENGTH_THRESHOLD} characters`);
    console.log(`AI patterns to detect: ${AI_THINKING_PATTERNS.length}`);
    
    const allAbnormal = [];
    
    // 1. Scan qbanks directory (preproff files)
    const qbanksDir = path.join(__dirname, '..', 'public', 'qbanks');
    console.log(`\n📁 Scanning: ${qbanksDir}`);
    
    const qbankFiles = fs.readdirSync(qbanksDir).filter(f => f.endsWith('.enc'));
    console.log(`Found ${qbankFiles.length} preproff files.`);
    
    for (const file of qbankFiles) {
        const filePath = path.join(qbanksDir, file);
        const abnormal = scanQBankFile(filePath);
        allAbnormal.push(...abnormal);
    }
    
    // 2. Scan initial_db.enc (main question bank)
    const assetsDir = path.join(__dirname, '..', 'public', 'assets');
    const initialDbPath = path.join(assetsDir, 'initial_db.enc');
    
    console.log(`\n📁 Scanning main database: ${initialDbPath}`);
    if (fs.existsSync(initialDbPath)) {
        const abnormal = scanQBankFile(initialDbPath);
        allAbnormal.push(...abnormal);
    } else {
        console.log('   ⚠️ initial_db.enc not found');
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 SUMMARY');
    console.log('=' .repeat(70));
    console.log(`Total abnormal explanations found: ${allAbnormal.length}`);
    
    if (allAbnormal.length > 0) {
        // Group by file
        const byFile = {};
        for (const item of allAbnormal) {
            if (!byFile[item.file]) byFile[item.file] = [];
            byFile[item.file].push(item);
        }
        
        console.log('\n📋 BREAKDOWN BY FILE:');
        for (const [file, items] of Object.entries(byFile)) {
            console.log(`\n  ${file}: ${items.length} abnormal explanations`);
        }
        
        // Save detailed report
        const reportPath = path.join(__dirname, 'abnormal-explanations-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(allAbnormal, null, 2));
        console.log(`\n💾 Detailed report saved to: ${reportPath}`);
        
        // Also save a human-readable report
        const textReportPath = path.join(__dirname, 'abnormal-explanations-report.txt');
        let textReport = 'ABNORMAL EXPLANATIONS REPORT\n';
        textReport += '=' .repeat(70) + '\n\n';
        
        for (let i = 0; i < Math.min(allAbnormal.length, 50); i++) {
            const item = allAbnormal[i];
            textReport += `[${i + 1}] File: ${item.file} | Year: ${item.year} | Index: ${item.index}\n`;
            textReport += `Length: ${item.explanationLength} chars | AI Patterns: ${item.patternCount}\n`;
            textReport += `Question: ${item.questionPreview}\n`;
            textReport += `Explanation:\n${item.explanation}\n`;
            textReport += '-' .repeat(70) + '\n\n';
        }
        
        fs.writeFileSync(textReportPath, textReport);
        console.log(`📝 Text report saved to: ${textReportPath}`);
    }
}

main();

