#!/usr/bin/env python3
"""
Extract KGMC Block J 2023 questions from preproff_j.txt
"""

import json
import os
import re

ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025"
QBANKS_DIR = r"c:\Users\haroo\Desktop\ProffMaster\public\qbanks"
SOURCE_FILE = r"c:\Users\haroo\Desktop\ProffMaster\2023_preproffs\preproff_j.txt"

def xor_encrypt(data: str, key: str) -> bytes:
    key_bytes = key.encode('utf-8')
    data_bytes = data.encode('utf-8')
    encrypted = bytes([data_bytes[i] ^ key_bytes[i % len(key_bytes)] for i in range(len(data_bytes))])
    return encrypted

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

def main():
    with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # The file might have issues, let's try to fix it
    # First, try to wrap it in proper array brackets
    content = content.strip()
    if not content.startswith('['):
        content = '[\n' + content
    if not content.endswith(']'):
        content = content.rstrip(',\n') + '\n]'
    
    # Try to parse
    try:
        data = json.loads(content)
        print(f"Successfully parsed {len(data)} questions from preproff_j.txt")
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        print("Trying regex extraction...")
        
        # Use regex to extract KGMC questions
        # Match complete question objects
        pattern = r'\{\s*"id"\s*:\s*"KGMC"[^}]+?"explanation"\s*:\s*"[^"]*"\s*\}'
        matches = re.findall(pattern, content, re.DOTALL)
        print(f"Found {len(matches)} KGMC question blocks via regex")
        
        data = []
        for match in matches:
            try:
                obj = json.loads(match)
                data.append(obj)
            except:
                pass
    
    # Filter KGMC questions
    kgmc_questions = []
    for item in data:
        if item.get('id', '').upper() == 'KGMC' and item.get('block', '').lower() == 'j':
            q = {
                'text': item['question'].strip(),
                'options': normalize_options(item['options']),
                'correct_index': normalize_answer(item['answer']),
                'explanation': item.get('explanation', '').strip(),
                'block': 'j',
                'college': 'kgmc',
                'year': '2023'
            }
            kgmc_questions.append(q)
    
    print(f"Found {len(kgmc_questions)} KGMC Block J 2023 questions")
    
    if kgmc_questions:
        # Create the encrypted file
        sql_lines = [generate_sql_insert(q) for q in kgmc_questions]
        sql_content = '\n'.join(sql_lines)
        
        output_path = os.path.join(QBANKS_DIR, 'kgmc J.enc')
        encrypted = xor_encrypt(sql_content, ENCRYPTION_KEY)
        with open(output_path, 'wb') as f:
            f.write(encrypted)
        
        print(f"✓ Created kgmc J.enc with {len(kgmc_questions)} questions")
    else:
        print("No KGMC Block J questions found!")

if __name__ == '__main__':
    main()
