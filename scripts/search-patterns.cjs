/**
 * Search for specific AI-thinking patterns across ALL encrypted files
 */

const fs = require('fs');
const path = require('path');

const ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025";

// Patterns that indicate AI "thinking aloud" - from the screenshot
const PROBLEMATIC_PATTERNS = [
    /\bWait,/gi,
    /\bActually,/gi,
    /\bLet me re-evaluate/gi,
    /\bLet's re-evaluate/gi,
    /\bIs there a better option/gi,
    /\bthe question implies/gi,
    /\bthis might be tricky/gi,
    /\bHowever, newer sources/gi,
    /\bHence \w+ is the relative/gi,
    /\bBut if we must choose/gi,
    /\bMaybe '\w+'/gi, // Like "Maybe 'Seizures'"
];

function decryptFile(encryptedBuffer) {
    const keyBytes = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    const decryptedBytes = Buffer.alloc(encryptedBuffer.length);
    
    for (let i = 0; i < encryptedBuffer.length; i++) {
        decryptedBytes[i] = encryptedBuffer[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return decryptedBytes.toString('utf-8');
}

function searchInFile(filePath) {
    const fileName = path.basename(filePath);
    const encryptedBuffer = fs.readFileSync(filePath);
    const decryptedText = decryptFile(encryptedBuffer);
    
    const matches = [];
    
    for (const pattern of PROBLEMATIC_PATTERNS) {
        const match = decryptedText.match(pattern);
        if (match) {
            // Find the context around the match
            const index = decryptedText.indexOf(match[0]);
            const start = Math.max(0, index - 100);
            const end = Math.min(decryptedText.length, index + 500);
            const context = decryptedText.substring(start, end);
            
            matches.push({
                pattern: pattern.source,
                match: match[0],
                context: context
            });
        }
    }
    
    return { fileName, matches };
}

function main() {
    const qbanksDir = path.join(__dirname, '..', 'public', 'qbanks');
    const files = fs.readdirSync(qbanksDir).filter(f => f.endsWith('.enc'));
    
    console.log('🔍 SEARCHING FOR AI "THINKING" PATTERNS');
    console.log('=' .repeat(70));
    console.log(`Scanning ${files.length} files for problematic patterns...\n`);
    
    let totalMatches = 0;
    
    for (const file of files) {
        const filePath = path.join(qbanksDir, file);
        const result = searchInFile(filePath);
        
        if (result.matches.length > 0) {
            console.log(`\n📂 ${result.fileName}: ${result.matches.length} matches found`);
            
            for (const m of result.matches) {
                totalMatches++;
                console.log(`\n  Pattern: ${m.pattern}`);
                console.log(`  Match: "${m.match}"`);
                console.log(`  Context:`);
                console.log(`    ${m.context.replace(/\n/g, ' ').substring(0, 400)}...`);
                console.log('  ' + '-'.repeat(50));
            }
        }
    }
    
    // Also search initial_db.enc
    const initialDbPath = path.join(__dirname, '..', 'public', 'assets', 'initial_db.enc');
    if (fs.existsSync(initialDbPath)) {
        const result = searchInFile(initialDbPath);
        if (result.matches.length > 0) {
            console.log(`\n📂 ${result.fileName}: ${result.matches.length} matches found`);
            for (const m of result.matches) {
                totalMatches++;
                console.log(`\n  Pattern: ${m.pattern}`);
                console.log(`  Match: "${m.match}"`);
                console.log(`  Context:`);
                console.log(`    ${m.context.replace(/\n/g, ' ').substring(0, 400)}...`);
                console.log('  ' + '-'.repeat(50));
            }
        }
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log(`📊 TOTAL MATCHES: ${totalMatches}`);
    
    if (totalMatches === 0) {
        console.log('\n✅ No AI "thinking" patterns found in any file.');
        console.log('\nThe problematic explanation you showed might be:');
        console.log('  1. In a file that was updated after your local copy');
        console.log('  2. From AI-generated questions stored in localStorage');
        console.log('  3. In a different data source not scanned');
    }
}

main();
