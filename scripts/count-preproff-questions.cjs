const fs = require('fs');
const path = require('path');

// Encryption key (same as used in the app)
const ENCRYPTION_KEY = 'SUPERSIX_SECURE_KEY_2025';

function decrypt(encryptedBuffer) {
  try {
    const keyBytes = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    const decryptedBytes = Buffer.alloc(encryptedBuffer.length);
    for (let i = 0; i < encryptedBuffer.length; i++) {
      decryptedBytes[i] = encryptedBuffer[i] ^ keyBytes[i % keyBytes.length];
    }
    return decryptedBytes.toString('utf-8');
  } catch (error) {
    console.error('Decryption error:', error.message);
    return null;
  }
}

function countQuestionsInFile(filePath) {
  try {
    const encryptedBuffer = fs.readFileSync(filePath);
    const decryptedContent = decrypt(encryptedBuffer);
    
    if (!decryptedContent) {
      return { error: 'Failed to decrypt' };
    }
    
    // Try JSON first
    try {
      const data = JSON.parse(decryptedContent);
      
      // Handle different data structures
      if (Array.isArray(data)) {
        return { count: data.length, structure: 'json-array' };
      } else if (data.questions && Array.isArray(data.questions)) {
        return { count: data.questions.length, structure: 'json-object-with-questions' };
      } else if (typeof data === 'object') {
        // Try to find any array property that might contain questions
        const arrays = Object.values(data).filter(v => Array.isArray(v));
        if (arrays.length > 0) {
          const maxLength = Math.max(...arrays.map(arr => arr.length));
          return { count: maxLength, structure: 'json-object-with-array' };
        }
      }
      
      return { count: 0, structure: 'json-unknown' };
    } catch (jsonError) {
      // Not JSON, try SQL format
      if (decryptedContent.includes('INSERT INTO')) {
        // Count INSERT statements
        const insertMatches = decryptedContent.match(/INSERT INTO/gi);
        const count = insertMatches ? insertMatches.length : 0;
        return { count, structure: 'sql-insert' };
      }
      
      return { error: 'Unknown format: ' + jsonError.message };
    }
  } catch (error) {
    return { error: error.message };
  }
}

// Get all .enc files from public/qbanks
const qbanksDir = path.join(__dirname, '..', 'public', 'qbanks');
const files = fs.readdirSync(qbanksDir).filter(f => f.endsWith('.enc'));

console.log('PreProff Question Bank Counts');
console.log('='.repeat(60));
console.log('');

const results = {};
let totalQuestions = 0;

// Group by institution
const institutions = {};

files.forEach(file => {
  const filePath = path.join(qbanksDir, file);
  const result = countQuestionsInFile(filePath);
  
  // Parse filename (e.g., "kmc M1.enc" -> institution: "kmc", paper: "M1")
  const match = file.match(/^([a-z]+)\s+(.+)\.enc$/i);
  if (match) {
    const institution = match[1].toUpperCase();
    const paper = match[2];
    
    if (!institutions[institution]) {
      institutions[institution] = {};
    }
    
    institutions[institution][paper] = result;
    
    if (result.count) {
      totalQuestions += result.count;
    }
  }
});

// Display results grouped by institution
Object.keys(institutions).sort().forEach(institution => {
  console.log(`${institution}:`);
  const papers = institutions[institution];
  
  Object.keys(papers).sort().forEach(paper => {
    const result = papers[paper];
    if (result.error) {
      console.log(`  ${paper}: ERROR - ${result.error}`);
    } else {
      console.log(`  ${paper}: ${result.count} questions`);
    }
  });
  
  // Calculate institution total
  const instTotal = Object.values(papers)
    .filter(r => r.count)
    .reduce((sum, r) => sum + r.count, 0);
  console.log(`  TOTAL: ${instTotal} questions`);
  console.log('');
});

console.log('='.repeat(60));
console.log(`GRAND TOTAL: ${totalQuestions} questions across all PreProff papers`);
console.log('='.repeat(60));

// Also create a JSON output
const jsonOutput = {
  timestamp: new Date().toISOString(),
  institutions,
  totalQuestions,
  totalPapers: files.length
};

fs.writeFileSync(
  path.join(__dirname, 'preproff-question-counts.json'),
  JSON.stringify(jsonOutput, null, 2)
);

console.log('\nDetailed results saved to: scripts/preproff-question-counts.json');
