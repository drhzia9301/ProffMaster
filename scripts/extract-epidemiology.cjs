/**
 * Script to extract Community Medicine / Epidemiology questions from KMU past questions
 * stored in initial_db.enc
 * 
 * Usage: node scripts/extract-epidemiology.cjs
 */

const fs = require('fs');
const path = require('path');

// Decryption key
const ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025";

function decryptFile(encryptedBuffer) {
    const keyBytes = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    const decryptedBytes = Buffer.alloc(encryptedBuffer.length);
    
    for (let i = 0; i < encryptedBuffer.length; i++) {
        decryptedBytes[i] = encryptedBuffer[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return decryptedBytes.toString('utf-8');
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
    // Format: INSERT OR REPLACE INTO questions (id, subject, topic, question, options, correct_answer, correct_index, explanation) VALUES (...)
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
                    topic: values[2],
                    question: values[3],
                    options: values[4],
                    correct_answer: values[5],
                    correct_index: values[6],
                    explanation: values[7]
                });
            }
        } catch(e) {
            // Skip malformed entries
        }
    }
    
    return questions;
}

/**
 * Check if a question is related to epidemiology
 */
function isEpidemiologyQuestion(q) {
    const epidemiologyKeywords = [
        'epidemiology',
        'incidence',
        'prevalence',
        'morbidity',
        'mortality',
        'case fatality',
        'attack rate',
        'surveillance',
        'outbreak',
        'epidemic',
        'pandemic',
        'endemic',
        'odds ratio',
        'relative risk',
        'attributable risk',
        'screening',
        'sensitivity',
        'specificity',
        'positive predictive',
        'negative predictive',
        'cohort study',
        'case control',
        'cross sectional',
        'randomized controlled',
        'clinical trial',
        'bias',
        'confounding',
        'standardization',
        'age adjusted',
        'crude rate',
        'specific rate',
        'person years',
        'life table',
        'survival analysis',
        'disease frequency',
        'risk factor',
        'exposure',
        'association',
        'causation',
        'hill criteria',
        'bradford hill',
        'confidence interval',
        'p value',
        'statistical significance',
        'sample size',
        'power',
        'hypothesis',
        'null hypothesis',
        'type i error',
        'type ii error',
        'standard deviation',
        'standard error',
        'mean',
        'median',
        'mode',
        'normal distribution',
        'chi square',
        't test',
        'anova',
        'correlation',
        'regression',
        'biostatistics',
        'vital statistics',
        'demography',
        'census',
        'population pyramid',
        'fertility rate',
        'birth rate',
        'death rate',
        'infant mortality',
        'maternal mortality',
        'neonatal mortality',
        'perinatal mortality',
        'life expectancy',
        'disability adjusted',
        'quality adjusted',
        'years of life lost',
        'burden of disease',
        'descriptive epidemiology',
        'analytical epidemiology',
        'experimental epidemiology',
        'spot map',
        'histogram',
        'pie chart',
        'bar diagram',
        'scatter diagram',
        'frequency polygon'
    ];

    const searchText = `${q.question || ''} ${q.topic || ''} ${q.options || ''}`.toLowerCase();
    
    return epidemiologyKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
}

/**
 * Format a question for output
 */
function formatQuestion(q, index) {
    let output = '';
    output += `\n${'='.repeat(80)}\n`;
    output += `Question ${index}\n`;
    output += `${'='.repeat(80)}\n\n`;
    output += `ID: ${q.id}\n`;
    output += `Subject: ${q.subject}\n`;
    output += `Topic: ${q.topic}\n\n`;
    output += `Question:\n${q.question}\n\n`;
    output += `Options:\n${q.options}\n\n`;
    output += `Correct Answer: ${q.correct_answer}\n`;
    if (q.explanation) {
        output += `\nExplanation:\n${q.explanation}\n`;
    }
    return output;
}

function main() {
    console.log('=' .repeat(70));
    console.log('📚 EXTRACTING COMMUNITY MEDICINE / EPIDEMIOLOGY QUESTIONS');
    console.log('=' .repeat(70));
    
    const initialDbPath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    
    if (!fs.existsSync(initialDbPath)) {
        console.error('❌ initial_db.enc not found!');
        return;
    }
    
    console.log('\n📂 Reading initial_db.enc...');
    const encryptedBuffer = fs.readFileSync(initialDbPath);
    const decryptedText = decryptFile(encryptedBuffer);
    
    console.log('📊 Parsing questions...');
    const allQuestions = parseQuestionsTableInserts(decryptedText);
    console.log(`   Found ${allQuestions.length} total questions`);
    
    // Filter for Community Medicine questions
    const communityMedicineQuestions = allQuestions.filter(q => {
        const subject = (q.subject || '').toLowerCase();
        return subject.includes('community') || subject.includes('epidemiology') || subject.includes('biostatistics');
    });
    
    console.log(`   Found ${communityMedicineQuestions.length} Community Medicine questions`);
    
    // Further filter for epidemiology-related questions
    const epidemiologyQuestions = communityMedicineQuestions.filter(isEpidemiologyQuestion);
    
    console.log(`   Found ${epidemiologyQuestions.length} Epidemiology-related questions`);
    
    // Also check if there are additional epidemiology questions in other subjects
    const otherEpidemiologyQuestions = allQuestions.filter(q => {
        const subject = (q.subject || '').toLowerCase();
        const isCommunityMed = subject.includes('community') || subject.includes('epidemiology') || subject.includes('biostatistics');
        return !isCommunityMed && isEpidemiologyQuestion(q);
    });
    
    if (otherEpidemiologyQuestions.length > 0) {
        console.log(`   Found ${otherEpidemiologyQuestions.length} additional epidemiology questions in other subjects`);
    }
    
    // Combine all epidemiology questions
    const allEpidemiologyQuestions = [...epidemiologyQuestions, ...otherEpidemiologyQuestions];
    
    // Format and save output
    let output = '';
    output += 'KMU PAST QUESTIONS - COMMUNITY MEDICINE / EPIDEMIOLOGY\n';
    output += '=' .repeat(80) + '\n';
    output += `Generated on: ${new Date().toLocaleString()}\n`;
    output += `Total Questions: ${allEpidemiologyQuestions.length}\n`;
    output += '=' .repeat(80) + '\n';
    
    allEpidemiologyQuestions.forEach((q, i) => {
        output += formatQuestion(q, i + 1);
    });
    
    const outputPath = path.join(__dirname, '..', 'kmu-epidemiology-questions.txt');
    fs.writeFileSync(outputPath, output, 'utf-8');
    
    console.log(`\n✅ Saved ${allEpidemiologyQuestions.length} questions to: kmu-epidemiology-questions.txt`);
    
    // Also show breakdown by topic
    console.log('\n📋 BREAKDOWN BY TOPIC:');
    const byTopic = {};
    allEpidemiologyQuestions.forEach(q => {
        const topic = q.topic || 'Unknown';
        if (!byTopic[topic]) byTopic[topic] = 0;
        byTopic[topic]++;
    });
    
    Object.entries(byTopic).sort((a, b) => b[1] - a[1]).forEach(([topic, count]) => {
        console.log(`   ${topic}: ${count} questions`);
    });
}

main();
