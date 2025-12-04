#!/usr/bin/env python3
"""
Check for duplicates between 2023 and 2024-25 questions.
"""

import os
import re
from pathlib import Path

ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025"
QBANKS_DIR = r"c:\Users\haroo\Desktop\ProffMaster\public\qbanks"

def xor_decrypt(data: bytes, key: str) -> str:
    key_bytes = key.encode('utf-8')
    decrypted = bytes([data[i] ^ key_bytes[i % len(key_bytes)] for i in range(len(data))])
    return decrypted.decode('utf-8')

def extract_questions(sql_content: str) -> list:
    """Extract question text and metadata from SQL INSERTs."""
    questions = []
    pattern = r"INSERT INTO preproff[^(]*\([^)]+\)\s*VALUES\s*\('((?:[^']|'')+)'"
    year_pattern = r",\s*'(\d{4})'\s*\)\s*;?\s*$"
    
    for line in sql_content.split('\n'):
        if 'INSERT INTO preproff' not in line:
            continue
        
        match = re.search(pattern, line)
        year_match = re.search(year_pattern, line)
        
        if match:
            text = match.group(1).replace("''", "'")
            year = year_match.group(1) if year_match else "unknown"
            questions.append({
                'text': text,
                'year': year,
                'line': line
            })
    
    return questions

def normalize_text(text: str) -> str:
    """Normalize question text for comparison."""
    # Remove extra whitespace, lowercase, remove punctuation for comparison
    text = re.sub(r'\s+', ' ', text.lower().strip())
    text = re.sub(r'[^\w\s]', '', text)
    return text

def main():
    print("Checking for duplicates across all years...\n")
    print("="*70)
    
    # Read all questions from all .enc files
    all_questions = []
    
    files = list(Path(QBANKS_DIR).glob('*.enc'))
    
    for filepath in sorted(files):
        with open(filepath, 'rb') as f:
            encrypted_data = f.read()
        
        content = xor_decrypt(encrypted_data, ENCRYPTION_KEY)
        questions = extract_questions(content)
        
        filename = filepath.name
        for q in questions:
            q['file'] = filename
        
        all_questions.extend(questions)
        print(f"{filename}: {len(questions)} questions")
    
    print(f"\nTotal questions: {len(all_questions)}")
    print("\n" + "="*70)
    print("\nChecking for cross-year duplicates (2023 vs 2024-25)...\n")
    
    # Group by normalized text
    text_to_questions = {}
    for q in all_questions:
        norm = normalize_text(q['text'])
        if norm not in text_to_questions:
            text_to_questions[norm] = []
        text_to_questions[norm].append(q)
    
    # Find duplicates across different years
    duplicates = []
    for norm_text, questions in text_to_questions.items():
        if len(questions) > 1:
            years = set(q['year'] for q in questions)
            if len(years) > 1:  # Same question in different years
                duplicates.append((norm_text, questions))
    
    if not duplicates:
        print("✓ No cross-year duplicates found!")
    else:
        print(f"Found {len(duplicates)} cross-year duplicates:\n")
        for i, (norm_text, questions) in enumerate(duplicates[:20], 1):  # Show first 20
            print(f"{i}. Question appears in multiple years:")
            for q in questions:
                print(f"   - {q['file']} ({q['year']})")
            print(f"   Text: {q['text'][:100]}...")
            print()
    
    # Also check for duplicates within the same year
    print("\n" + "="*70)
    print("\nChecking for same-year duplicates within files...\n")
    
    same_year_dups = []
    for norm_text, questions in text_to_questions.items():
        if len(questions) > 1:
            # Group by year
            by_year = {}
            for q in questions:
                y = q['year']
                if y not in by_year:
                    by_year[y] = []
                by_year[y].append(q)
            
            for year, year_questions in by_year.items():
                if len(year_questions) > 1:
                    same_year_dups.append((norm_text, year_questions))
    
    if not same_year_dups:
        print("✓ No same-year duplicates found!")
    else:
        print(f"Found {len(same_year_dups)} same-year duplicates:\n")
        for i, (norm_text, questions) in enumerate(same_year_dups[:10], 1):
            q = questions[0]
            print(f"{i}. Year {q['year']}: {len(questions)} copies in files: {', '.join(set(q['file'] for q in questions))}")
            print(f"   Text: {q['text'][:80]}...")
            print()

if __name__ == '__main__':
    main()
