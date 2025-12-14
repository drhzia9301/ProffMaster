/**
 * Extract questions by subject from initial_db.enc for review
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

function extractBySubject(subject) {
    const dbPath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    const encBuffer = fs.readFileSync(dbPath);
    const content = decrypt(encBuffer);
    
    // Extract all questions
    const regex = /INSERT OR REPLACE INTO questions \(id, subject, topic, question, options, correct_answer, correct_index, explanation, difficulty\) VALUES \('([^']+)', '([^']+)', '([^']+)', '([^']*)', '(\[.*?\])', '([^']*)', (\d+), '([^']*)', '([^']*)'\);/g;
    
    const questions = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        if (match[2].toLowerCase() === subject.toLowerCase()) {
            questions.push({
                id: match[1],
                subject: match[2],
                topic: match[3],
                question: match[4],
                options: match[5],
                correct_answer: match[6],
                correct_index: parseInt(match[7]),
                explanation: match[8],
                difficulty: match[9]
            });
        }
    }
    
    return questions;
}

function formatForReview(questions, subject) {
    let output = `${subject.toUpperCase()} QUESTIONS - REVIEW FILE\n`;
    output += `${"=".repeat(80)}\n`;
    output += `Total: ${questions.length} questions\n`;
    output += `Generated: ${new Date().toLocaleString()}\n`;
    output += `${"=".repeat(80)}\n\n`;
    output += `Instructions: Review each question for:\n`;
    output += `  1. Correct answer accuracy\n`;
    output += `  2. Spelling/grammar issues\n`;
    output += `  3. Option formatting\n`;
    output += `Mark any issues with [ISSUE] prefix\n\n`;
    
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        output += `${"=".repeat(80)}\n`;
        output += `Q${i + 1}. ID: ${q.id}\n`;
        output += `Topic: ${q.topic}\n`;
        output += `${"=".repeat(80)}\n\n`;
        
        output += `Question:\n${q.question}\n\n`;
        
        output += `Options:\n`;
        try {
            const opts = JSON.parse(q.options);
            opts.forEach((opt, idx) => {
                const marker = idx === q.correct_index ? '✓' : ' ';
                output += `  ${marker} ${opt}\n`;
            });
        } catch(e) {
            output += `  ${q.options}\n`;
        }
        
        output += `\nMarked Correct: ${q.correct_answer} (index: ${q.correct_index})\n`;
        
        output += `\nExplanation:\n${q.explanation}\n`;
        
        output += `\n[STATUS: OK / ISSUE]\n`;
        output += `[NOTES: ]\n`;
        output += `\n`;
    }
    
    return output;
}

// Get subject from command line
const subject = process.argv[2] || 'Psychiatry';
console.log(`Extracting ${subject} questions...`);

const questions = extractBySubject(subject);
console.log(`Found ${questions.length} questions`);

const output = formatForReview(questions, subject);
const outputPath = path.join(__dirname, '..', `review-${subject.toLowerCase().replace(/\s+/g, '-')}.txt`);
fs.writeFileSync(outputPath, output);
console.log(`Saved to: review-${subject.toLowerCase().replace(/\s+/g, '-')}.txt`);
