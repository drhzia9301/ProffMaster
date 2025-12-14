/**
 * Extract Block J, K, L Preproff Questions from all colleges
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

function extractBlockQuestions(block) {
    console.log("=".repeat(60));
    console.log(`EXTRACTING BLOCK ${block.toUpperCase()} PREPROFF QUESTIONS`);
    console.log("=".repeat(60));
    
    const qbanksDir = path.join(__dirname, '..', 'public', 'qbanks');
    const blockFiles = fs.readdirSync(qbanksDir).filter(f => 
        f.toLowerCase().includes(` ${block.toLowerCase()}.enc`) && !f.includes('backup')
    );
    
    let allQuestions = [];
    
    for (const file of blockFiles) {
        const filePath = path.join(qbanksDir, file);
        console.log(`\n📂 Processing: ${file}`);
        
        try {
            const encryptedBuffer = fs.readFileSync(filePath);
            const content = decrypt(encryptedBuffer);
            
            let questions = [];
            const college = file.replace(new RegExp(` ${block}\\.enc`, 'i'), '').toUpperCase();
            
            // Try JSON first
            try {
                const parsed = JSON.parse(content);
                questions = Array.isArray(parsed) ? parsed.flat() : [parsed];
                questions = questions.map((q, idx) => ({
                    ...q,
                    college: college,
                    source: file,
                    block: block.toUpperCase()
                }));
            } catch (e) {
                // Try SQL INSERT format
                if (content.includes('INSERT INTO')) {
                    const insertRegex = /INSERT\s+INTO\s+preproff\s*\([^)]+\)\s*VALUES\s*\((.+?)\)(?:;|$)/gi;
                    let match;
                    
                    while ((match = insertRegex.exec(content)) !== null) {
                        try {
                            const values = parseInsertValues(match[1]);
                            if (values.length >= 5) {
                                questions.push({
                                    id: values[0] || `${college}_${block}_${questions.length}`,
                                    question: values[1],
                                    options: values[2],
                                    correctIndex: parseInt(values[3]) || 0,
                                    explanation: values[4],
                                    subject: values[5] || 'Unknown',
                                    topic: values[6] || 'Unknown',
                                    college: college,
                                    source: file,
                                    block: block.toUpperCase()
                                });
                            }
                        } catch(e) {}
                    }
                }
            }
            
            console.log(`   Found ${questions.length} questions`);
            allQuestions.push(...questions);
            
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }
    
    // Write to text file
    let output = `BLOCK ${block.toUpperCase()} PREPROFF QUESTIONS - ALL COLLEGES\n`;
    output += `${"=".repeat(80)}\n`;
    output += `Generated on: ${new Date().toLocaleString()}\n`;
    output += `Total Questions: ${allQuestions.length}\n`;
    output += `${"=".repeat(80)}\n\n`;
    
    let questionNum = 1;
    for (const q of allQuestions) {
        output += `${"=".repeat(80)}\n`;
        output += `Question ${questionNum} (${q.college || q.source})\n`;
        output += `${"=".repeat(80)}\n\n`;
        
        if (q.subject) output += `Subject: ${q.subject}\n`;
        if (q.topic) output += `Topic: ${q.topic}\n\n`;
        
        output += `Question:\n${q.question || q.text}\n\n`;
        
        output += `Options:\n`;
        let options = q.options;
        if (typeof options === 'string') {
            try {
                options = JSON.parse(options);
            } catch(e) {
                options = [options];
            }
        }
        if (Array.isArray(options)) {
            options.forEach((opt, idx) => {
                const marker = idx === (q.correctIndex || 0) ? '✓' : ' ';
                output += `${marker} ${opt}\n`;
            });
        }
        
        output += `\nCorrect Answer Index: ${q.correctIndex || q.answer || 0}\n`;
        
        if (q.explanation) {
            output += `\nExplanation:\n${q.explanation}\n`;
        }
        
        output += `\n`;
        questionNum++;
    }
    
    const outputPath = path.join(__dirname, '..', `block-${block.toLowerCase()}-preproff-questions.txt`);
    fs.writeFileSync(outputPath, output);
    console.log(`\n💾 Saved to: block-${block.toLowerCase()}-preproff-questions.txt (${allQuestions.length} questions)`);
    
    return allQuestions.length;
}

function main() {
    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║     EXTRACT BLOCK J, K, L PREPROFF QUESTIONS              ║");
    console.log("╚═══════════════════════════════════════════════════════════╝\n");
    
    const jCount = extractBlockQuestions('J');
    const kCount = extractBlockQuestions('K');
    const lCount = extractBlockQuestions('L');
    
    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));
    console.log(`Block J Questions: ${jCount}`);
    console.log(`Block K Questions: ${kCount}`);
    console.log(`Block L Questions: ${lCount}`);
    console.log(`Total: ${jCount + kCount + lCount}`);
    console.log("\nFiles created:");
    console.log("  - block-j-preproff-questions.txt");
    console.log("  - block-k-preproff-questions.txt");
    console.log("  - block-l-preproff-questions.txt");
}

main();
