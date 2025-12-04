#!/usr/bin/env python3
"""
Fix M2 preproff issues:
1. Extract KGMC M2 2023 questions from preproff_m2.txt and create kgmc M2.enc
2. Move KMC 2024 questions from M1 to M2
3. Add m2kmc2023.txt to KMC M2 2023
"""

import json
import os
import re
from pathlib import Path

ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025"
QBANKS_DIR = r"c:\Users\haroo\Desktop\ProffMaster\public\qbanks"
SOURCE_DIR = r"c:\Users\haroo\Desktop\ProffMaster\2023_preproffs"

def xor_encrypt(data: str, key: str) -> bytes:
    key_bytes = key.encode('utf-8')
    data_bytes = data.encode('utf-8')
    encrypted = bytes([data_bytes[i] ^ key_bytes[i % len(key_bytes)] for i in range(len(data_bytes))])
    return encrypted

def xor_decrypt(data: bytes, key: str) -> str:
    key_bytes = key.encode('utf-8')
    decrypted = bytes([data[i] ^ key_bytes[i % len(key_bytes)] for i in range(len(data))])
    return decrypted.decode('utf-8')

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

def change_block_in_sql(sql_line: str, new_block: str) -> str:
    """Change the block in an SQL INSERT line."""
    # Pattern to match the block value (8th value in the INSERT)
    # The block appears twice: once as subject/topic and once as the actual block field
    # Values: text, options, correct_index, explanation, subject, topic, difficulty, block, college, year
    
    # Replace all occurrences of 'm1' with 'm2' in the block positions
    # The block is stored in positions 5, 6 (subject/topic) and 8 (actual block)
    result = sql_line
    
    # Replace Block M1 -> Block M2
    result = result.replace("'Block M1'", "'Block M2'")
    result = result.replace("'block m1'", "'block m2'")
    result = result.replace("'m1'", "'m2'")
    
    return result

def main():
    print("="*70)
    print("FIXING M2 PREPROFF ISSUES")
    print("="*70)
    
    # =========================================
    # 1. Extract KGMC M2 2023 from preproff_m2.txt
    # =========================================
    print("\n1. Extracting KGMC M2 2023 questions from preproff_m2.txt\n")
    
    with open(os.path.join(SOURCE_DIR, 'preproff_m2.txt'), 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix the file - it has multiple JSON arrays concatenated
    # Replace '],\n  {' with '},\n  {'
    content = content.replace('],\n  {', '},\n  {')
    # Also ensure it ends properly
    if content.strip().endswith('}'):
        content = content.strip() + '\n]'
    
    try:
        m2_data = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"  Error parsing JSON: {e}")
        # Try to extract just the KGMC questions using regex
        m2_data = []
        pattern = r'\{\s*"id"\s*:\s*"KGMC"[^}]+\}'
        # Actually let's just manually find and parse KGMC entries
        # For now, let's read from a different approach
    
    kgmc_questions = []
    for item in m2_data:
        if item['id'].upper() == 'KGMC' and item['block'].lower() == 'm2':
            q = {
                'text': item['question'].strip(),
                'options': normalize_options(item['options']),
                'correct_index': normalize_answer(item['answer']),
                'explanation': item.get('explanation', '').strip(),
                'block': 'm2',
                'college': 'kgmc',
                'year': str(item['year']).strip()
            }
            kgmc_questions.append(q)
    
    print(f"  Found {len(kgmc_questions)} KGMC M2 2023 questions")
    
    # Create kgmc M2.enc file
    if kgmc_questions:
        sql_lines = [generate_sql_insert(q) for q in kgmc_questions]
        content = '\n'.join(sql_lines)
        
        output_path = os.path.join(QBANKS_DIR, 'kgmc M2.enc')
        encrypted = xor_encrypt(content, ENCRYPTION_KEY)
        with open(output_path, 'wb') as f:
            f.write(encrypted)
        print(f"  ✓ Created kgmc M2.enc with {len(kgmc_questions)} questions")
    
    # =========================================
    # 2. Move KMC 2024 M1 questions to M2
    # =========================================
    print("\n2. Moving KMC 2024 questions from M1 to M2\n")
    
    # Read kmc M1.enc
    m1_path = os.path.join(QBANKS_DIR, 'kmc M1.enc')
    with open(m1_path, 'rb') as f:
        m1_content = xor_decrypt(f.read(), ENCRYPTION_KEY)
    
    m1_lines = m1_content.split('\n')
    m1_2023_lines = []
    m1_2024_lines = []
    
    for line in m1_lines:
        if 'INSERT INTO preproff' in line:
            if "'2024'" in line:
                m1_2024_lines.append(line)
            else:
                m1_2023_lines.append(line)
        elif line.strip():
            m1_2023_lines.append(line)
    
    print(f"  KMC M1: {len(m1_2023_lines)} questions for 2023, {len(m1_2024_lines)} questions for 2024")
    
    # Update kmc M1.enc to only have 2023
    if m1_2024_lines:
        new_m1_content = '\n'.join(m1_2023_lines)
        encrypted = xor_encrypt(new_m1_content, ENCRYPTION_KEY)
        with open(m1_path, 'wb') as f:
            f.write(encrypted)
        print(f"  ✓ Updated kmc M1.enc: now has {len(m1_2023_lines)} questions (2023 only)")
    
    # Add to kmc M2.enc (need to create it or append)
    m2_path = os.path.join(QBANKS_DIR, 'kmc M2.enc')
    
    # Convert M1 2024 lines to M2
    m2_2024_lines = [change_block_in_sql(line, 'm2') for line in m1_2024_lines]
    
    if os.path.exists(m2_path):
        with open(m2_path, 'rb') as f:
            existing_m2_content = xor_decrypt(f.read(), ENCRYPTION_KEY)
        m2_content = existing_m2_content + '\n' + '\n'.join(m2_2024_lines)
    else:
        m2_content = '\n'.join(m2_2024_lines)
    
    encrypted = xor_encrypt(m2_content, ENCRYPTION_KEY)
    with open(m2_path, 'wb') as f:
        f.write(encrypted)
    
    new_m2_count = m2_content.count('INSERT INTO preproff')
    print(f"  ✓ Updated kmc M2.enc: now has {new_m2_count} questions")
    
    # =========================================
    # 3. Add m2kmc2023.txt questions
    # =========================================
    print("\n3. Adding m2kmc2023.txt questions to KMC M2\n")
    
    with open(os.path.join(SOURCE_DIR, 'm2kmc2023.txt'), 'r', encoding='utf-8') as f:
        kmc_2023_data = json.load(f)
    
    kmc_2023_questions = []
    for item in kmc_2023_data:
        q = {
            'text': item['question'].strip(),
            'options': normalize_options(item['options']),
            'correct_index': normalize_answer(item['answer']),
            'explanation': item.get('explanation', '').strip(),
            'block': 'm2',
            'college': 'kmc',
            'year': '2023'
        }
        kmc_2023_questions.append(q)
    
    print(f"  Found {len(kmc_2023_questions)} KMC M2 2023 questions to add")
    
    # Read current kmc M2.enc and append
    with open(m2_path, 'rb') as f:
        current_m2_content = xor_decrypt(f.read(), ENCRYPTION_KEY)
    
    new_sql_lines = [generate_sql_insert(q) for q in kmc_2023_questions]
    final_m2_content = current_m2_content + '\n' + '\n'.join(new_sql_lines)
    
    encrypted = xor_encrypt(final_m2_content, ENCRYPTION_KEY)
    with open(m2_path, 'wb') as f:
        f.write(encrypted)
    
    final_count = final_m2_content.count('INSERT INTO preproff')
    print(f"  ✓ Updated kmc M2.enc: now has {final_count} questions total")
    
    # =========================================
    # Summary
    # =========================================
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    
    # Count questions in each M2 file
    m2_files = ['gmc M2.enc', 'kgmc M2.enc', 'kmc M2.enc', 'nwsm M2.enc', 'wmc M2.enc']
    
    for filename in m2_files:
        filepath = os.path.join(QBANKS_DIR, filename)
        if os.path.exists(filepath):
            with open(filepath, 'rb') as f:
                content = xor_decrypt(f.read(), ENCRYPTION_KEY)
            
            count_2023 = content.count("'2023'")
            count_2024 = content.count("'2024'")
            total = content.count('INSERT INTO preproff')
            
            print(f"  {filename}: Total {total} (2023: {count_2023}, 2024: {count_2024})")
        else:
            print(f"  {filename}: NOT FOUND")
    
    print("\n  Also check kmc M1.enc:")
    with open(os.path.join(QBANKS_DIR, 'kmc M1.enc'), 'rb') as f:
        m1_content = xor_decrypt(f.read(), ENCRYPTION_KEY)
    m1_total = m1_content.count('INSERT INTO preproff')
    print(f"  kmc M1.enc: Total {m1_total} questions")

if __name__ == '__main__':
    main()
