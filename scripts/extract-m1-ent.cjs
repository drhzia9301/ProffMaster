/**
 * Extract M1 Preproff Questions and ENT Questions from initial_db
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

function extractM1Preproffs() {
    console.log("=".repeat(60));
    console.log("EXTRACTING M1 PREPROFF QUESTIONS");
    console.log("=".repeat(60));
    
    const qbanksDir = path.join(__dirname, '..', 'public', 'qbanks');
    const m1Files = fs.readdirSync(qbanksDir).filter(f => f.includes('M1.enc') && !f.includes('backup'));
    
    let allM1Questions = [];
    
    for (const file of m1Files) {
        const filePath = path.join(qbanksDir, file);
        console.log(`\n📂 Processing: ${file}`);
        
        try {
            const encryptedBuffer = fs.readFileSync(filePath);
            const content = decrypt(encryptedBuffer);
            
            let questions = [];
            const college = file.replace(' M1.enc', '').toUpperCase();
            
            // Try JSON first
            try {
                const parsed = JSON.parse(content);
                questions = Array.isArray(parsed) ? parsed.flat() : [parsed];
                questions = questions.map((q, idx) => ({
                    ...q,
                    college: college,
                    source: file
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
                                    id: values[0] || `${college}_M1_${questions.length}`,
                                    question: values[1],
                                    options: values[2],
                                    correctIndex: parseInt(values[3]) || 0,
                                    explanation: values[4],
                                    subject: values[5] || 'Unknown',
                                    topic: values[6] || 'Unknown',
                                    college: college,
                                    source: file
                                });
                            }
                        } catch(e) {}
                    }
                }
            }
            
            console.log(`   Found ${questions.length} questions`);
            allM1Questions.push(...questions);
            
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }
    
    // Write to text file
    let output = `M1 PREPROFF QUESTIONS - ALL COLLEGES\n`;
    output += `${"=".repeat(80)}\n`;
    output += `Generated on: ${new Date().toLocaleString()}\n`;
    output += `Total Questions: ${allM1Questions.length}\n`;
    output += `${"=".repeat(80)}\n\n`;
    
    let questionNum = 1;
    for (const q of allM1Questions) {
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
    
    const outputPath = path.join(__dirname, '..', 'm1-preproff-questions.txt');
    fs.writeFileSync(outputPath, output);
    console.log(`\n💾 Saved to: m1-preproff-questions.txt (${allM1Questions.length} questions)`);
    
    return allM1Questions.length;
}

function extractENTQuestions() {
    console.log("\n" + "=".repeat(60));
    console.log("EXTRACTING ENT QUESTIONS FROM INITIAL_DB");
    console.log("=".repeat(60));
    
    const filePath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    
    if (!fs.existsSync(filePath)) {
        console.log("❌ initial_db.enc not found!");
        return 0;
    }
    
    const encryptedBuffer = fs.readFileSync(filePath);
    const content = decrypt(encryptedBuffer);
    
    // Parse questions table
    const questions = [];
    const insertRegex = /INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+questions\s*\([^)]+\)\s*VALUES\s*\((.+?)\)(?:;|$)/gi;
    let match;
    
    while ((match = insertRegex.exec(content)) !== null) {
        try {
            const values = parseInsertValues(match[1]);
            // questions table: id, subject, topic, question, options, correct_answer, correct_index, explanation
            if (values.length >= 8) {
                const subject = values[1];
                if (subject && subject.toLowerCase() === 'ent') {
                    questions.push({
                        id: values[0],
                        subject: values[1],
                        topic: values[2],
                        question: values[3],
                        options: values[4],
                        correctAnswer: values[5],
                        correctIndex: parseInt(values[6]) || 0,
                        explanation: values[7]
                    });
                }
            }
        } catch(e) {}
    }
    
    console.log(`Found ${questions.length} ENT questions`);
    
    // Write to text file
    let output = `ENT QUESTIONS FROM KMU PAST PAPERS\n`;
    output += `${"=".repeat(80)}\n`;
    output += `Generated on: ${new Date().toLocaleString()}\n`;
    output += `Total Questions: ${questions.length}\n`;
    output += `${"=".repeat(80)}\n\n`;
    
    let questionNum = 1;
    for (const q of questions) {
        output += `${"=".repeat(80)}\n`;
        output += `Question ${questionNum}\n`;
        output += `${"=".repeat(80)}\n\n`;
        
        output += `ID: ${q.id}\n`;
        output += `Subject: ${q.subject}\n`;
        output += `Topic: ${q.topic}\n\n`;
        
        output += `Question:\n${q.question}\n\n`;
        
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
                const marker = idx === q.correctIndex ? '✓' : ' ';
                output += `${marker} ${opt}\n`;
            });
        }
        
        output += `\nCorrect Answer: ${q.correctAnswer}\n`;
        
        if (q.explanation) {
            output += `\nExplanation:\n${q.explanation}\n`;
        }
        
        output += `\n`;
        questionNum++;
    }
    
    const outputPath = path.join(__dirname, '..', 'ent-questions.txt');
    fs.writeFileSync(outputPath, output);
    console.log(`\n💾 Saved to: ent-questions.txt (${questions.length} questions)`);
    
    return questions.length;
}

function main() {
    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║     EXTRACT M1 PREPROFF & ENT QUESTIONS                   ║");
    console.log("╚═══════════════════════════════════════════════════════════╝\n");
    
    const m1Count = extractM1Preproffs();
    const entCount = extractENTQuestions();
    
    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));
    console.log(`M1 Preproff Questions: ${m1Count}`);
    console.log(`ENT Questions: ${entCount}`);
    console.log("\nFiles created:");
    console.log("  - m1-preproff-questions.txt");
    console.log("  - ent-questions.txt");
}

main();
