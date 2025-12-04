#!/usr/bin/env python3
"""
Remove all duplicates from preproff files:
- Cross-year duplicates: Keep the earliest year version
- Same-year duplicates: Keep only one copy
"""

import os
import re
from pathlib import Path
from collections import defaultdict

ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025"
QBANKS_DIR = r"c:\Users\haroo\Desktop\ProffMaster\public\qbanks"

def xor_encrypt(data: str, key: str) -> bytes:
    key_bytes = key.encode('utf-8')
    data_bytes = data.encode('utf-8')
    encrypted = bytes([data_bytes[i] ^ key_bytes[i % len(key_bytes)] for i in range(len(data_bytes))])
    return encrypted

def xor_decrypt(data: bytes, key: str) -> str:
    key_bytes = key.encode('utf-8')
    decrypted = bytes([data[i] ^ key_bytes[i % len(key_bytes)] for i in range(len(data))])
    return decrypted.decode('utf-8')

def extract_question_text(line: str) -> str:
    """Extract the question text from an SQL INSERT."""
    pattern = r"INSERT INTO preproff[^(]*\([^)]+\)\s*VALUES\s*\('((?:[^']|'')+)'"
    match = re.search(pattern, line)
    if match:
        return match.group(1).replace("''", "'")
    return ""

def extract_year(line: str) -> str:
    """Extract year from SQL INSERT."""
    pattern = r",\s*'(\d{4})'\s*\)\s*;?\s*$"
    match = re.search(pattern, line)
    return match.group(1) if match else "0000"

def normalize_text(text: str) -> str:
    """Normalize question text for comparison."""
    text = re.sub(r'\s+', ' ', text.lower().strip())
    text = re.sub(r'[^\w\s]', '', text)
    return text

def main():
    print("Removing duplicates from all preproff files...\n")
    print("="*70)
    
    # First pass: collect all questions
    all_questions = []  # (normalized_text, year, file, line)
    file_contents = {}  # filename -> list of lines
    
    files = list(Path(QBANKS_DIR).glob('*.enc'))
    
    for filepath in sorted(files):
        filename = filepath.name
        with open(filepath, 'rb') as f:
            encrypted_data = f.read()
        
        content = xor_decrypt(encrypted_data, ENCRYPTION_KEY)
        lines = content.split('\n')
        file_contents[filename] = lines
        
        for line in lines:
            if 'INSERT INTO preproff' in line:
                text = extract_question_text(line)
                year = extract_year(line)
                norm = normalize_text(text)
                all_questions.append({
                    'norm': norm,
                    'year': year,
                    'file': filename,
                    'line': line
                })
        
        print(f"{filename}: {sum(1 for l in lines if 'INSERT INTO' in l)} questions")
    
    print(f"\nTotal questions before dedup: {len(all_questions)}")
    
    # Group by normalized text
    text_groups = defaultdict(list)
    for q in all_questions:
        text_groups[q['norm']].append(q)
    
    # Determine which lines to keep
    # Only remove duplicates within the SAME file (not across different college files)
    lines_to_remove = set()
    
    for norm_text, questions in text_groups.items():
        # Group by file
        by_file = defaultdict(list)
        for q in questions:
            by_file[q['file']].append(q)
        
        # For each file, keep only the first occurrence
        for filename, file_questions in by_file.items():
            if len(file_questions) > 1:
                # Sort by year (earliest first)
                file_questions.sort(key=lambda x: x['year'])
                # Keep the first one, remove the rest
                for q in file_questions[1:]:
                    lines_to_remove.add((q['file'], q['line']))
    
    print(f"\nLines to remove: {len(lines_to_remove)}")
    
    # Second pass: write files without duplicates
    print("\n" + "="*70)
    print("\nWriting deduplicated files:\n")
    
    total_removed = 0
    
    for filename, lines in file_contents.items():
        original_count = sum(1 for l in lines if 'INSERT INTO' in l)
        
        # Filter out duplicate lines
        kept_lines = []
        removed = 0
        for line in lines:
            if 'INSERT INTO preproff' in line:
                if (filename, line) in lines_to_remove:
                    removed += 1
                    continue
            kept_lines.append(line)
        
        new_count = sum(1 for l in kept_lines if 'INSERT INTO' in l)
        
        if removed > 0:
            print(f"{filename}: {original_count} -> {new_count} (removed {removed})")
            total_removed += removed
            
            # Write back
            new_content = '\n'.join(kept_lines)
            # Clean up extra newlines
            while '\n\n\n' in new_content:
                new_content = new_content.replace('\n\n\n', '\n\n')
            
            filepath = Path(QBANKS_DIR) / filename
            encrypted = xor_encrypt(new_content, ENCRYPTION_KEY)
            with open(filepath, 'wb') as f:
                f.write(encrypted)
        else:
            print(f"{filename}: {original_count} (no duplicates)")
    
    print(f"\n" + "="*70)
    print(f"\nTotal duplicates removed: {total_removed}")
    print(f"Questions remaining: {len(all_questions) - total_removed}")

if __name__ == '__main__':
    main()
