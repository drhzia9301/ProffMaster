/**
 * Bulk Question Quality Scanner
 * Scans all questions for common issues:
 * - Spelling errors (common medical terms)
 * - Grammar patterns
 * - Missing/incomplete explanations
 * - Answer validation issues
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

// Common spelling mistakes in medical terms
const SPELLING_FIXES = {
    'Tri cyclic': 'Tricyclic',
    'tri cyclic': 'tricyclic',
    'anti depressive': 'antidepressant',
    'anti depressant': 'antidepressant',
    'Anti-depressants': 'Antidepressants',
    'arrythmia': 'arrhythmia',
    'Arrythmia': 'Arrhythmia',
    'diarrhoea': 'diarrhea',
    'haemorrhage': 'hemorrhage',
    'oedema': 'edema',
    'anaemia': 'anemia',
    'foetus': 'fetus',
    'haemoglobin': 'hemoglobin',
    'leucocyte': 'leukocyte',
    'tumour': 'tumor',
    'colour': 'color',
    'behaviour': 'behavior',
    'neighbour': 'neighbor',
    'favour': 'favor',
    'labelled': 'labeled',
    'modelled': 'modeled',
    'cancelled': 'canceled',
    'travelled': 'traveled',
    'centre': 'center',
    'fibre': 'fiber',
    'litre': 'liter',
    'metre': 'meter',
    'programme': 'program',
    'speciliased': 'specialized',
    'catgorise': 'categorize',
    'recognise': 'recognize',
    'emphasise': 'emphasize',
    'characterised': 'characterized',
    'teh': 'the',
    'adn': 'and',
    'taht': 'that',
    'whcih': 'which',
    'thier': 'their',
    'recieve': 'receive',
    'occured': 'occurred',
    'occuring': 'occurring',
    'seperate': 'separate',
    'definately': 'definitely',
    'occassion': 'occasion',
    'neccessary': 'necessary',
    'accomodate': 'accommodate',
    'embarass': 'embarrass',
    'existance': 'existence',
    'occurance': 'occurrence',
    'persistant': 'persistent',
    'consistant': 'consistent',
    'dependant': 'dependent',
    'independant': 'independent',
    'prevelant': 'prevalent',
    'resistent': 'resistant',
    'maintainance': 'maintenance',
    'occassionally': 'occasionally',
    'immediatly': 'immediately',
    'aproximately': 'approximately',
    'basicly': 'basically',
    'completly': 'completely',
    'defintely': 'definitely',
    'extremly': 'extremely',
    'generaly': 'generally',
    'naturaly': 'naturally',
    'probaly': 'probably',
    'realy': 'really',
    'seperately': 'separately',
    'usally': 'usually',
};

// Patterns that indicate potential issues
const ISSUE_PATTERNS = [
    { pattern: /\bDuplicate of ID\b/i, issue: 'Duplicate explanation reference' },
    { pattern: /\?\s*$/, issue: 'Explanation ends with question mark' },
    { pattern: /\bWait,?\s/i, issue: 'AI thinking pattern' },
    { pattern: /\bActually,?\s/i, issue: 'AI thinking pattern' },
    { pattern: /\bLet me\s/i, issue: 'AI thinking pattern' },
    { pattern: /\bLet\'s\s/i, issue: 'AI thinking pattern' },
    { pattern: /^.{0,20}$/, issue: 'Very short explanation (<20 chars)' },
    { pattern: /\s{2,}/, issue: 'Multiple consecutive spaces' },
    { pattern: /\(\s+/g, issue: 'Space after opening parenthesis' },
    { pattern: /\s+\)/g, issue: 'Space before closing parenthesis' },
];

function extractAllQuestions(content) {
    const regex = /INSERT OR REPLACE INTO questions \(id, subject, topic, question, options, correct_answer, correct_index, explanation, difficulty\) VALUES \('([^']+)', '([^']+)', '([^']+)', '([^']*)', '(\[.*?\])', '([^']*)', (\d+), '([^']*)', '([^']*)'\);/g;
    
    const questions = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        questions.push({
            id: match[1],
            subject: match[2],
            topic: match[3],
            question: match[4],
            options: match[5],
            correct_answer: match[6],
            correct_index: parseInt(match[7]),
            explanation: match[8],
            difficulty: match[9],
            fullMatch: match[0]
        });
    }
    
    return questions;
}

function scanForIssues(questions) {
    const issues = [];
    
    for (const q of questions) {
        const questionIssues = [];
        const fullText = `${q.question} ${q.options} ${q.explanation}`;
        
        // Check spelling
        for (const [wrong, correct] of Object.entries(SPELLING_FIXES)) {
            if (fullText.includes(wrong)) {
                questionIssues.push({
                    type: 'SPELLING',
                    detail: `"${wrong}" should be "${correct}"`
                });
            }
        }
        
        // Check patterns in explanation
        for (const { pattern, issue } of ISSUE_PATTERNS) {
            if (pattern.test(q.explanation)) {
                questionIssues.push({
                    type: 'PATTERN',
                    detail: issue
                });
            }
        }
        
        // Check for answer validation
        try {
            const opts = JSON.parse(q.options);
            if (q.correct_index >= opts.length) {
                questionIssues.push({
                    type: 'ANSWER',
                    detail: `Correct index ${q.correct_index} >= options count ${opts.length}`
                });
            }
            if (!opts[q.correct_index] || !opts[q.correct_index].includes(q.correct_answer.replace(/^[a-e]\.\s*/, ''))) {
                // Check if the answer text doesn't match
                const answerText = q.correct_answer.replace(/^[a-e]\.\s*/, '').toLowerCase().trim();
                const optionText = (opts[q.correct_index] || '').replace(/^[a-e]\.\s*/, '').toLowerCase().trim();
                if (answerText !== optionText && optionText.indexOf(answerText) === -1 && answerText.indexOf(optionText) === -1) {
                    questionIssues.push({
                        type: 'ANSWER_MISMATCH',
                        detail: `Answer "${q.correct_answer}" may not match option at index ${q.correct_index}`
                    });
                }
            }
        } catch (e) {
            questionIssues.push({
                type: 'OPTIONS_PARSE',
                detail: 'Failed to parse options JSON'
            });
        }
        
        if (questionIssues.length > 0) {
            issues.push({
                id: q.id,
                subject: q.subject,
                topic: q.topic,
                question: q.question.substring(0, 80) + (q.question.length > 80 ? '...' : ''),
                issues: questionIssues
            });
        }
    }
    
    return issues;
}

function main() {
    console.log("=".repeat(70));
    console.log("BULK QUESTION QUALITY SCANNER");
    console.log("=".repeat(70));
    
    const dbPath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    const encBuffer = fs.readFileSync(dbPath);
    const content = decrypt(encBuffer);
    
    const questions = extractAllQuestions(content);
    console.log(`\nTotal questions: ${questions.length}`);
    
    const issues = scanForIssues(questions);
    console.log(`Questions with issues: ${issues.length}`);
    
    // Group by issue type
    const byType = {};
    for (const item of issues) {
        for (const issue of item.issues) {
            if (!byType[issue.type]) byType[issue.type] = [];
            byType[issue.type].push({ ...item, issue: issue });
        }
    }
    
    console.log("\n" + "=".repeat(70));
    console.log("ISSUES BY TYPE");
    console.log("=".repeat(70));
    
    for (const [type, items] of Object.entries(byType)) {
        console.log(`\n${type}: ${items.length} issues`);
        // Show first 5 examples
        items.slice(0, 5).forEach(item => {
            console.log(`  - ${item.id}: ${item.issue.detail}`);
        });
        if (items.length > 5) {
            console.log(`  ... and ${items.length - 5} more`);
        }
    }
    
    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        totalQuestions: questions.length,
        questionsWithIssues: issues.length,
        issuesByType: Object.fromEntries(
            Object.entries(byType).map(([type, items]) => [type, items.length])
        ),
        details: issues
    };
    
    fs.writeFileSync(
        path.join(__dirname, 'quality-scan-report.json'),
        JSON.stringify(report, null, 2)
    );
    
    console.log("\n\nDetailed report saved to: scripts/quality-scan-report.json");
}

main();
