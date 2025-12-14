/**
 * Analyze initial_db.enc questions by subject/topic for batch review planning
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

function main() {
    const dbPath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    const encBuffer = fs.readFileSync(dbPath);
    const content = decrypt(encBuffer);
    
    // Extract all questions
    const regex = /INSERT OR REPLACE INTO questions \(id, subject, topic, question, options, correct_answer, correct_index, explanation, difficulty\) VALUES \('([^']+)', '([^']+)', '([^']+)', '([^']*)', '([^']*)', '([^']*)', (\d+), '([^']*)', '([^']*)'\);/g;
    
    const questions = [];
    const subjects = {};
    const topics = {};
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        const q = {
            id: match[1],
            subject: match[2],
            topic: match[3],
            question: match[4],
            options: match[5],
            correct_answer: match[6],
            correct_index: parseInt(match[7]),
            explanation: match[8],
            difficulty: match[9]
        };
        questions.push(q);
        
        subjects[q.subject] = (subjects[q.subject] || 0) + 1;
        const topicKey = `${q.subject} > ${q.topic}`;
        topics[topicKey] = (topics[topicKey] || 0) + 1;
    }
    
    console.log("=".repeat(70));
    console.log("INITIAL_DB.ENC QUESTION ANALYSIS");
    console.log("=".repeat(70));
    console.log(`\nTotal questions: ${questions.length}\n`);
    
    console.log("BY SUBJECT:");
    console.log("-".repeat(50));
    Object.entries(subjects)
        .sort((a, b) => b[1] - a[1])
        .forEach(([subject, count]) => {
            console.log(`  ${subject.padEnd(30)} ${count}`);
        });
    
    console.log("\n\nBY TOPIC (top 30):");
    console.log("-".repeat(50));
    Object.entries(topics)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .forEach(([topic, count]) => {
            console.log(`  ${topic.substring(0, 45).padEnd(45)} ${count}`);
        });
    
    // Save summary
    const summary = {
        totalQuestions: questions.length,
        subjects: subjects,
        topics: topics
    };
    
    fs.writeFileSync(
        path.join(__dirname, 'initial_db_summary.json'),
        JSON.stringify(summary, null, 2)
    );
    
    console.log("\n\nSaved summary to: scripts/initial_db_summary.json");
}

main();
