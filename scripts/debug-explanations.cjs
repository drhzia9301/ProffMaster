/**
 * Debug script to view sample explanations from encrypted files
 * to verify parsing is correct
 */

const fs = require('fs');
const path = require('path');

const ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025";

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

function main() {
    // Pick one file to analyze
    const testFile = process.argv[2] || 'kmc K.enc';
    const qbanksDir = path.join(__dirname, '..', 'public', 'qbanks');
    const filePath = path.join(qbanksDir, testFile);
    
    console.log(`\n📂 Analyzing: ${testFile}`);
    console.log('=' .repeat(70));
    
    const encryptedBuffer = fs.readFileSync(filePath);
    const decryptedText = decryptFile(encryptedBuffer);
    
    // Try JSON first
    let questions = [];
    let format = 'unknown';
    
    try {
        const parsed = JSON.parse(decryptedText);
        questions = Array.isArray(parsed) ? parsed.flat() : [parsed];
        format = 'json';
    } catch (e) {
        // Check for SQL format
        if (decryptedText.includes('INSERT INTO')) {
            format = 'sql';
            
            // Parse SQL - use the preproff table format
            const insertRegex = /INSERT\s+INTO\s+preproff\s*\([^)]+\)\s*VALUES\s*\((.+?)\)(?:;|$)/gi;
            let match;
            
            while ((match = insertRegex.exec(decryptedText)) !== null) {
                try {
                    const values = parseInsertValues(match[1]);
                    // preproff columns: text, options, correct_index, explanation, subject, topic, difficulty, block, college, year
                    // So values: 0=text, 1=options, 2=correct_index, 3=explanation
                    if (values.length >= 4) {
                        questions.push({
                            text: values[0],
                            options: values[1],
                            correctIndex: parseInt(values[2]) || 0,
                            explanation: values[3],
                            year: values[9] || 'Unknown'
                        });
                    }
                } catch(e) {}
            }
        }
    }
    
    console.log(`Format: ${format}`);
    console.log(`Questions found: ${questions.length}`);
    
    // Show sample explanations
    console.log('\n📝 SAMPLE EXPLANATIONS:');
    console.log('=' .repeat(70));
    
    let showedSamples = 0;
    const longExplanations = [];
    
    for (let i = 0; i < questions.length && showedSamples < 5; i++) {
        const q = questions[i];
        if (q.explanation && q.explanation.length > 10) {
            console.log(`\n[${i}] Question: ${(q.text || '').substring(0, 80)}...`);
            console.log(`Explanation (${q.explanation.length} chars):`);
            console.log(q.explanation);
            console.log('-' .repeat(50));
            showedSamples++;
        }
        
        // Track long ones
        if (q.explanation && q.explanation.length > 400) {
            longExplanations.push({
                index: i,
                length: q.explanation.length,
                preview: q.explanation.substring(0, 200),
                full: q.explanation
            });
        }
    }
    
    // Show longest explanations
    if (longExplanations.length > 0) {
        console.log('\n\n🚨 LONG EXPLANATIONS (>400 chars):');
        console.log('=' .repeat(70));
        
        longExplanations.sort((a, b) => b.length - a.length);
        
        for (const item of longExplanations.slice(0, 10)) {
            console.log(`\n[Index ${item.index}] Length: ${item.length} chars`);
            console.log('Full explanation:');
            console.log(item.full);
            console.log('-' .repeat(50));
        }
    } else {
        console.log('\n✅ No explanations over 400 chars found');
    }
    
    // Stats
    const explanationLengths = questions
        .filter(q => q.explanation)
        .map(q => q.explanation.length);
    
    if (explanationLengths.length > 0) {
        console.log('\n📊 EXPLANATION LENGTH STATS:');
        console.log(`Min: ${Math.min(...explanationLengths)}`);
        console.log(`Max: ${Math.max(...explanationLengths)}`);
        console.log(`Avg: ${Math.round(explanationLengths.reduce((a,b) => a+b, 0) / explanationLengths.length)}`);
        console.log(`Over 500: ${explanationLengths.filter(l => l > 500).length}`);
        console.log(`Over 800: ${explanationLengths.filter(l => l > 800).length}`);
    }
}

main();
