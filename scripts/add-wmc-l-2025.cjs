/**
 * Add WMC L 2025 questions
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

function escapeSQL(str) {
    if (!str) return '';
    return str.replace(/'/g, "''");
}

function getCorrectIndexFromAnswer(answer, options) {
    if (typeof answer === 'string' && answer.length === 1) {
        return answer.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
    }
    return 0;
}

function main() {
    console.log("=== Adding WMC L 2025 Questions ===\n");
    
    // Load source
    const sourcePath = path.join(__dirname, '..', 'new', '9.BLOCK L WMC 2025.txt');
    const sourceContent = fs.readFileSync(sourcePath, 'utf8');
    const questions = JSON.parse(sourceContent);
    console.log(`  Source: ${questions.length} questions`);
    
    // Load current WMC L
    const wmcPath = path.join(__dirname, '..', 'public', 'qbanks', 'wmc L.enc');
    const encBuffer = fs.readFileSync(wmcPath);
    let content = decrypt(encBuffer);
    
    const before2023 = (content.match(/'2023'/g) || []).length;
    const before2024 = (content.match(/'2024'/g) || []).length;
    const before2025 = (content.match(/'2025'/g) || []).length;
    console.log(`  Current: 2023=${before2023}, 2024=${before2024}, 2025=${before2025}`);
    
    // Add 2025 questions
    let inserts = '';
    for (const q of questions) {
        const text = escapeSQL(q.question || '');
        const options = JSON.stringify(q.options || []).replace(/'/g, "''");
        const correctIdx = getCorrectIndexFromAnswer(q.answer, q.options);
        const explanation = escapeSQL(q.explanation || '');
        const subject = escapeSQL(q.subject || '');
        const topic = escapeSQL(q.topic || '');
        
        inserts += `INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('${text}', '${options}', ${correctIdx}, '${explanation}', '${subject}', '${topic}', 'Medium', 'L', 'WMC', '2025');\n`;
    }
    
    content = content.trim() + '\n' + inserts;
    
    const after2023 = (content.match(/'2023'/g) || []).length;
    const after2024 = (content.match(/'2024'/g) || []).length;
    const after2025 = (content.match(/'2025'/g) || []).length;
    const total = after2023 + after2024 + after2025;
    
    console.log(`  New counts: 2023=${after2023}, 2024=${after2024}, 2025=${after2025}`);
    console.log(`  Total: ${total} questions`);
    
    // Save
    fs.copyFileSync(wmcPath, wmcPath + '.backup9');
    fs.writeFileSync(wmcPath, encrypt(content));
    console.log('\n✅ Saved WMC L');
    console.log(`\nWMC L now has ${total} questions (${after2023} from 2023, ${after2024} from 2024, ${after2025} from 2025)`);
}

main();
