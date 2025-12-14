/**
 * Comprehensive extraction of ALL preproff questions (Block J, K, L, M1, M2)
 * Properly handles both SQL and JSON formats
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

function getCorrectIndexFromAnswer(answer, options) {
    // Handle letter-based answers like "a", "b", "c", "d", "e"
    if (typeof answer === 'string' && answer.length === 1) {
        const letterIndex = answer.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
        if (letterIndex >= 0 && letterIndex < options.length) {
            return letterIndex;
        }
    }
    // Handle numeric answers
    if (typeof answer === 'number') {
        return answer;
    }
    // Try to find matching option
    if (Array.isArray(options)) {
        for (let i = 0; i < options.length; i++) {
            if (options[i] === answer || options[i].includes(answer)) {
                return i;
            }
        }
    }
    return 0;
}

function extractQuestionsFromFile(filePath, block) {
    const fileName = path.basename(filePath);
    const encryptedBuffer = fs.readFileSync(filePath);
    const content = decrypt(encryptedBuffer);
    
    let questions = [];
    let format = 'unknown';
    
    // Extract college name from filename (e.g., "gmc J.enc" -> "GMC")
    const college = fileName.replace(new RegExp(`\\s*${block}\\.enc`, 'i'), '').toUpperCase();
    
    // Try JSON first
    if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(content);
            const items = Array.isArray(parsed) ? parsed.flat() : [parsed];
            format = 'json';
            
            for (const q of items) {
                let opts = q.options;
                if (typeof opts === 'string') {
                    try { opts = JSON.parse(opts); } catch(e) { opts = [opts]; }
                }
                
                const correctIdx = q.correctIndex !== undefined 
                    ? q.correctIndex 
                    : getCorrectIndexFromAnswer(q.answer, opts);
                
                questions.push({
                    question: q.question || q.text || '',
                    options: opts || [],
                    correctIndex: correctIdx,
                    explanation: q.explanation || '',
                    subject: q.subject || '',
                    topic: q.topic || '',
                    college: college,
                    block: block,
                    year: q.year || ''
                });
            }
        } catch (e) {
            // Not valid JSON, try SQL
        }
    }
    
    // Try SQL INSERT format
    if (questions.length === 0 && content.includes('INSERT INTO')) {
        format = 'sql';
        // SQL format: (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year)
        const insertRegex = /INSERT\s+INTO\s+preproff\s*\([^)]+\)\s*VALUES\s*\((.+?)\);/gi;
        let match;
        
        while ((match = insertRegex.exec(content)) !== null) {
            try {
                const values = parseInsertValues(match[1]);
                // Format: text(0), options(1), correct_index(2), explanation(3), subject(4), topic(5), difficulty(6), block(7), college(8), year(9)
                if (values.length >= 4) {
                    let opts = values[1];
                    if (typeof opts === 'string') {
                        try { opts = JSON.parse(opts); } catch(e) { opts = [opts]; }
                    }
                    
                    questions.push({
                        question: values[0] || '',
                        options: opts || [],
                        correctIndex: parseInt(values[2]) || 0,
                        explanation: values[3] || '',
                        subject: values[4] || '',
                        topic: values[5] || '',
                        college: college,
                        block: block,
                        year: values[9] || ''
                    });
                }
            } catch(e) {
                // Skip malformed
            }
        }
    }
    
    return { questions, format, college };
}

function formatQuestionOutput(q, num) {
    let output = `${"=".repeat(80)}\n`;
    output += `Question ${num} (${q.college}${q.year ? ' - ' + q.year : ''})\n`;
    output += `${"=".repeat(80)}\n\n`;
    
    if (q.subject) output += `Subject: ${q.subject}\n`;
    if (q.topic) output += `Topic: ${q.topic}\n`;
    if (q.subject || q.topic) output += `\n`;
    
    output += `Question:\n${q.question}\n\n`;
    
    output += `Options:\n`;
    if (Array.isArray(q.options)) {
        q.options.forEach((opt, idx) => {
            const marker = idx === q.correctIndex ? '✓' : ' ';
            output += `${marker} ${opt}\n`;
        });
    }
    
    if (q.explanation) {
        output += `\nExplanation:\n${q.explanation}\n`;
    }
    
    output += `\n`;
    return output;
}

function extractBlock(block) {
    console.log("\n" + "=".repeat(60));
    console.log(`EXTRACTING BLOCK ${block.toUpperCase()} PREPROFF QUESTIONS`);
    console.log("=".repeat(60));
    
    const qbanksDir = path.join(__dirname, '..', 'public', 'qbanks');
    const blockPattern = new RegExp(`\\s${block}\\.enc$`, 'i');
    const files = fs.readdirSync(qbanksDir).filter(f => 
        blockPattern.test(f) && !f.includes('backup')
    );
    
    let allQuestions = [];
    
    for (const file of files) {
        const filePath = path.join(qbanksDir, file);
        console.log(`\n📂 ${file}`);
        
        try {
            const { questions, format, college } = extractQuestionsFromFile(filePath, block);
            console.log(`   ✅ ${questions.length} questions (${format})`);
            allQuestions.push(...questions);
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }
    
    // Write to file
    let output = `BLOCK ${block.toUpperCase()} PREPROFF QUESTIONS - ALL COLLEGES\n`;
    output += `${"=".repeat(80)}\n`;
    output += `Generated on: ${new Date().toLocaleString()}\n`;
    output += `Total Questions: ${allQuestions.length}\n`;
    output += `${"=".repeat(80)}\n\n`;
    
    allQuestions.forEach((q, idx) => {
        output += formatQuestionOutput(q, idx + 1);
    });
    
    const outputPath = path.join(__dirname, '..', `block-${block.toLowerCase()}-preproff-questions.txt`);
    fs.writeFileSync(outputPath, output);
    console.log(`\n💾 Saved: block-${block.toLowerCase()}-preproff-questions.txt (${allQuestions.length} questions)`);
    
    return allQuestions.length;
}

function main() {
    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║   COMPREHENSIVE PREPROFF EXTRACTION - ALL BLOCKS          ║");
    console.log("╚═══════════════════════════════════════════════════════════╝");
    
    const blocks = ['J', 'K', 'L', 'M1', 'M2'];
    const counts = {};
    
    for (const block of blocks) {
        counts[block] = extractBlock(block);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));
    
    let total = 0;
    for (const block of blocks) {
        console.log(`Block ${block}: ${counts[block]} questions`);
        total += counts[block];
    }
    console.log(`\nTotal: ${total} questions`);
    
    console.log("\nFiles created:");
    for (const block of blocks) {
        console.log(`  - block-${block.toLowerCase()}-preproff-questions.txt`);
    }
}

main();
