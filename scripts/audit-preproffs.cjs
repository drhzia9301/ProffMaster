/**
 * Comprehensive Preproff Audit - Compare current vs git history for all files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025";

function decrypt(encryptedBuffer) {
    const keyBytes = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    const decryptedBytes = Buffer.alloc(encryptedBuffer.length);
    for (let i = 0; i < encryptedBuffer.length; i++) {
        decryptedBytes[i] = encryptedBuffer[i] ^ keyBytes[i % keyBytes.length];
    }
    return decryptedBytes.toString('utf-8');
}

function countQuestions(content) {
    // Try JSON
    try {
        const j = JSON.parse(content);
        const items = Array.isArray(j) ? j.flat() : [j];
        return items.length;
    } catch(e) {}
    
    // Try SQL
    const matches = content.match(/INSERT INTO preproff/gi);
    return matches ? matches.length : 0;
}

function getFileSize(content) {
    return Buffer.from(content).length;
}

function main() {
    console.log("=".repeat(70));
    console.log("COMPREHENSIVE PREPROFF DATA AUDIT");
    console.log("=".repeat(70));
    console.log("");
    
    const qbanksDir = path.join(__dirname, '..', 'public', 'qbanks');
    const files = fs.readdirSync(qbanksDir).filter(f => f.endsWith('.enc') && !f.includes('backup'));
    
    const issues = [];
    
    console.log("Checking each file against git history...\n");
    
    for (const file of files.sort()) {
        const filePath = path.join(qbanksDir, file);
        
        try {
            // Get current data
            const currentBuffer = fs.readFileSync(filePath);
            const currentContent = decrypt(currentBuffer);
            const currentCount = countQuestions(currentContent);
            const currentSize = currentBuffer.length;
            
            // Get max historical size from git
            let historicalMax = { size: 0, count: 0, commit: '' };
            
            try {
                // Get all commits that touched this file
                const logOutput = execSync(`git log --oneline --all -- "public/qbanks/${file}"`, { 
                    encoding: 'utf8',
                    cwd: path.join(__dirname, '..')
                });
                
                const commits = logOutput.trim().split('\n').filter(l => l);
                
                for (const line of commits.slice(0, 10)) { // Check last 10 commits
                    const commit = line.split(' ')[0];
                    try {
                        const histContent = execSync(`git show ${commit}:"public/qbanks/${file}"`, { 
                            encoding: 'buffer',
                            cwd: path.join(__dirname, '..')
                        });
                        
                        const histDecrypted = decrypt(histContent);
                        const histCount = countQuestions(histDecrypted);
                        
                        if (histContent.length > historicalMax.size) {
                            historicalMax = { size: histContent.length, count: histCount, commit };
                        }
                    } catch(e) {}
                }
            } catch(e) {}
            
            // Compare
            const sizeDiff = historicalMax.size - currentSize;
            const countDiff = historicalMax.count - currentCount;
            
            let status = '✅';
            if (sizeDiff > 1000 || countDiff > 5) {
                status = '❌';
                issues.push({
                    file,
                    currentSize,
                    currentCount,
                    maxSize: historicalMax.size,
                    maxCount: historicalMax.count,
                    bestCommit: historicalMax.commit,
                    sizeDiff,
                    countDiff
                });
            } else if (sizeDiff > 0 || countDiff > 0) {
                status = '⚠️';
            }
            
            console.log(`${status} ${file.padEnd(20)} Current: ${currentCount.toString().padStart(4)} questions (${(currentSize/1024).toFixed(1)}KB)`);
            if (historicalMax.count > currentCount) {
                console.log(`   └─ Historical max: ${historicalMax.count} questions (${(historicalMax.size/1024).toFixed(1)}KB) at ${historicalMax.commit}`);
            }
            
        } catch (error) {
            console.log(`❌ ${file}: Error - ${error.message}`);
        }
    }
    
    // Summary
    console.log("\n" + "=".repeat(70));
    console.log("ISSUES FOUND");
    console.log("=".repeat(70));
    
    if (issues.length === 0) {
        console.log("\n✅ No significant data loss detected!");
    } else {
        console.log(`\n❌ Found ${issues.length} files with data loss:\n`);
        
        for (const issue of issues) {
            console.log(`📂 ${issue.file}`);
            console.log(`   Current:  ${issue.currentCount} questions (${(issue.currentSize/1024).toFixed(1)}KB)`);
            console.log(`   Max ever: ${issue.maxCount} questions (${(issue.maxSize/1024).toFixed(1)}KB)`);
            console.log(`   Missing:  ${issue.countDiff} questions`);
            console.log(`   Restore:  git checkout ${issue.bestCommit} -- "public/qbanks/${issue.file}"`);
            console.log('');
        }
        
        // Save restore commands
        const restoreScript = issues.map(i => 
            `git checkout ${i.bestCommit} -- "public/qbanks/${i.file}"`
        ).join('\n');
        
        fs.writeFileSync(path.join(__dirname, 'restore-commands.txt'), restoreScript);
        console.log("Restore commands saved to: scripts/restore-commands.txt");
    }
}

main();
