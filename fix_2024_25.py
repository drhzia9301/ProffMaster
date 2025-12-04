#!/usr/bin/env python3
"""
Fix the 2024-25 preproff files by separating years properly.
This script:
1. Reads the current .enc files 
2. Extracts questions by year
3. Removes incorrectly added 2024-25 questions
4. Re-adds them with correct college assignment from filename
"""

import json
import os
import re
from pathlib import Path

ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025"
SOURCE_DIR = r"c:\Users\haroo\Desktop\ProffMaster\2023_preproffs\2024-25"
OUTPUT_DIR = r"c:\Users\haroo\Desktop\ProffMaster\public\qbanks"

def xor_encrypt(data: str, key: str) -> bytes:
    key_bytes = key.encode('utf-8')
    data_bytes = data.encode('utf-8')
    encrypted = bytes([data_bytes[i] ^ key_bytes[i % len(key_bytes)] for i in range(len(data_bytes))])
    return encrypted

def xor_decrypt(data: bytes, key: str) -> str:
    key_bytes = key.encode('utf-8')
    decrypted = bytes([data[i] ^ key_bytes[i % len(key_bytes)] for i in range(len(data))])
    return decrypted.decode('utf-8')

def parse_sql_year(sql_line: str) -> str:
    """Extract year from an SQL INSERT statement."""
    # The year is the last value in VALUES(...)
    match = re.search(r",\s*'(\d{4})'\s*\)\s*;?\s*$", sql_line)
    if match:
        return match.group(1)
    return None

def filter_sql_by_year(sql_content: str, years_to_keep: list) -> str:
    """Filter SQL INSERT statements to only keep specified years."""
    lines = sql_content.split('\n')
    filtered = []
    for line in lines:
        if 'INSERT INTO preproff' in line:
            year = parse_sql_year(line)
            if year and year in years_to_keep:
                filtered.append(line)
            elif not year:
                # Keep lines without year info
                filtered.append(line)
        elif line.strip():
            filtered.append(line)
    return '\n'.join(filtered)

def normalize_answer(answer: str) -> int:
    answer = answer.strip().lower()
    if answer in ['a', 'a)']:
        return 0
    elif answer in ['b', 'b)']:
        return 1
    elif answer in ['c', 'c)']:
        return 2
    elif answer in ['d', 'd)']:
        return 3
    elif answer in ['e', 'e)']:
        return 4
    return 0

def normalize_options(options: list) -> list:
    normalized = []
    for opt in options:
        cleaned = re.sub(r'^[A-Ea-e][\.\)]\s*', '', opt.strip())
        normalized.append(cleaned)
    return normalized

def escape_sql(text: str) -> str:
    return text.replace("'", "''")

def generate_sql_insert(q: dict) -> str:
    options_json = json.dumps(q['options'])
    return f"""INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{escape_sql(q['text'])}', '{escape_sql(options_json)}', {q['correct_index']}, '{escape_sql(q['explanation'])}', '', '', 'medium', '{escape_sql(q['block'])}', '{escape_sql(q['college'])}', '{escape_sql(q['year'])}');"""

def get_file_info(filename: str) -> tuple:
    name = os.path.splitext(filename)[0].lower()
    match = re.match(r'([jklm][12]?)(wmc|kmc|gmc|kgmc|nwsm)(\d{4})', name)
    if match:
        block = match.group(1)
        college = match.group(2)
        year = match.group(3)
        return block, college, year
    return None, None, None

def parse_json_file(filepath: str, override_college: str) -> list:
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = []
    for item in data:
        q = {
            'text': item['question'].strip(),
            'options': normalize_options(item['options']),
            'correct_index': normalize_answer(item['answer']),
            'explanation': item.get('explanation', '').strip(),
            'block': item['block'].lower().strip(),
            'college': override_college,  # Always use college from filename
            'year': str(item['year']).strip()
        }
        questions.append(q)
    return questions

def parse_text_file(filepath: str, block: str, college: str, year: str) -> list:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    questions = []
    pattern = r'(?:^|\n)(\d+)\.\s+'
    parts = re.split(pattern, content)
    
    i = 1
    while i < len(parts) - 1:
        q_num = parts[i]
        q_text = parts[i + 1]
        i += 2
        
        option_pattern = r'(?:^|\n)\s*([a-e])[\.\)]\s*(.+?)(?=(?:\n\s*[a-e][\.\)]|\Z))'
        options_matches = re.findall(option_pattern, q_text, re.IGNORECASE | re.DOTALL)
        
        if len(options_matches) >= 2:
            first_option_match = re.search(r'\n\s*[a-e][\.\)]', q_text, re.IGNORECASE)
            if first_option_match:
                question_text = q_text[:first_option_match.start()].strip()
            else:
                question_text = q_text.strip()
            
            options = [opt[1].strip().split('\n')[0].strip() for opt in options_matches]
            
            q = {
                'text': question_text,
                'options': options,
                'correct_index': 0,
                'explanation': '',
                'block': block,
                'college': college,
                'year': year
            }
            questions.append(q)
    
    return questions

def main():
    print("Step 1: Restoring 2023-only files\n")
    print("="*60)
    
    # Files that need restoration (had 2024/2025 added incorrectly)
    files_to_fix = [
        'wmc J.enc',  # Has 2023 + 2024 + 2025
        'wmc K.enc',  # Has 2023 + 2025
        'gmc L.enc',  # Has 2023 + 2024
        'kmc L.enc',  # Has 2023 + 2024
        'wmc L.enc',  # Has 2023 + 2024
        'gmc M1.enc', # Has 2023 + 2024
        'kmc M1.enc', # Has 2023 + 2024
        'wmc M1.enc', # Has 2023 + 2024
        'gmc M2.enc', # Has 2023 + 2024
    ]
    
    # Read and filter each file to only keep 2023
    for filename in files_to_fix:
        filepath = os.path.join(OUTPUT_DIR, filename)
        if os.path.exists(filepath):
            with open(filepath, 'rb') as f:
                encrypted_data = f.read()
            
            content = xor_decrypt(encrypted_data, ENCRYPTION_KEY)
            original_count = content.count('INSERT INTO preproff')
            
            # Filter to only keep 2023
            filtered = filter_sql_by_year(content, ['2023'])
            filtered_count = filtered.count('INSERT INTO preproff')
            
            print(f"{filename}: {original_count} -> {filtered_count} (removing 2024-25)")
            
            # Write back
            encrypted = xor_encrypt(filtered, ENCRYPTION_KEY)
            with open(filepath, 'wb') as f:
                f.write(encrypted)
    
    print("\n" + "="*60)
    print("\nStep 2: Processing 2024-25 files with correct college assignment\n")
    
    # Process source files
    source_path = Path(SOURCE_DIR)
    files = list(source_path.glob('*.txt'))
    
    # Collect questions by (block, college)
    all_questions = {}
    
    for file_path in sorted(files):
        filename = file_path.name
        block, college, year = get_file_info(filename)
        
        if not block:
            print(f"⚠ Could not parse: {filename}")
            continue
        
        print(f"Processing {filename} -> Block {block.upper()}, {college.upper()}, {year}")
        
        try:
            questions = parse_json_file(str(file_path), college)
            print(f"  ✓ {len(questions)} questions")
        except:
            questions = parse_text_file(str(file_path), block, college, year)
            print(f"  ✓ {len(questions)} questions (text format)")
        
        key = (block, college)
        if key not in all_questions:
            all_questions[key] = []
        all_questions[key].extend(questions)
    
    print("\n" + "="*60)
    print("\nStep 3: Appending 2024-25 to encrypted files\n")
    
    for (block, college), questions in sorted(all_questions.items()):
        output_name = f"{college} {block.upper()}.enc"
        output_path = os.path.join(OUTPUT_DIR, output_name)
        
        # Read existing content
        existing_content = ""
        if os.path.exists(output_path):
            with open(output_path, 'rb') as f:
                encrypted_data = f.read()
            existing_content = xor_decrypt(encrypted_data, ENCRYPTION_KEY)
        
        existing_count = existing_content.count('INSERT INTO preproff') if existing_content else 0
        
        # Generate SQL for new questions
        new_sql_lines = [generate_sql_insert(q) for q in questions]
        new_sql = '\n'.join(new_sql_lines)
        
        # Combine
        if existing_content:
            final_content = existing_content + '\n' + new_sql
        else:
            final_content = new_sql
        
        # Write encrypted
        encrypted = xor_encrypt(final_content, ENCRYPTION_KEY)
        with open(output_path, 'wb') as f:
            f.write(encrypted)
        
        final_count = final_content.count('INSERT INTO preproff')
        years_added = sorted(set(q['year'] for q in questions))
        print(f"{output_name}: {existing_count} + {len(questions)} = {final_count} (added years: {', '.join(years_added)})")
    
    print("\n" + "="*60)
    print("\nDone! Summary of 2024-25 questions by block/college/year:")
    print("-"*60)
    
    for (block, college), questions in sorted(all_questions.items()):
        by_year = {}
        for q in questions:
            y = q['year']
            by_year[y] = by_year.get(y, 0) + 1
        for year, count in sorted(by_year.items()):
            print(f"  Block {block.upper()} | {college.upper()} | {year}: {count} questions")

if __name__ == '__main__':
    main()
