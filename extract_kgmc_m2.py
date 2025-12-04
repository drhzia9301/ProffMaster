#!/usr/bin/env python3
"""
Extract KGMC M2 2023 questions from preproff_m2.txt
"""

import json
import os
import re

ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025"
QBANKS_DIR = r"c:\Users\haroo\Desktop\ProffMaster\public\qbanks"
SOURCE_FILE = r"c:\Users\haroo\Desktop\ProffMaster\2023_preproffs\preproff_m2.txt"

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
    
    # The file has multiple JSON arrays - let's split and merge
    # Find all JSON objects
    
    # Use regex to find complete JSON objects
    # Pattern to match question objects
    object_pattern = r'\{\s*"id"\s*:\s*"([^"]+)"[^}]*"block"\s*:\s*"([^"]+)"[^}]*"year"\s*:\s*"([^"]+)"[^}]*"question"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"options"\s*:\s*\[((?:[^\]])*)\]\s*,\s*"answer"\s*:\s*"([^"]+)"[^}]*"explanation"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}'
    
    # Actually, let's try a simpler approach - split by "id" field patterns
    # Extract individual question blocks
    
    questions = []
    
    # Find all occurrences of question objects
    pattern = r'"id"\s*:\s*"KGMC"'
    
    # Let's try to parse it by fixing the concatenation issue
    # Replace the broken point where ] and { meet
    lines = content.split('\n')
    fixed_lines = []
    prev_line_ends_bracket = False
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Check if previous line was '],' and this line starts with '{'
        if prev_line_ends_bracket and stripped.startswith('{'):
            # Skip this - we already handled it
            fixed_lines.append(line)
        elif stripped == '],' or stripped == ']':
            # Change to }
            if i + 1 < len(lines) and lines[i+1].strip().startswith('{'):
                fixed_lines.append(line.replace(']', '},'))
                prev_line_ends_bracket = True
            else:
                fixed_lines.append(line)
                prev_line_ends_bracket = False
        else:
            fixed_lines.append(line)
            prev_line_ends_bracket = False
    
    fixed_content = '\n'.join(fixed_lines)
    
    # Ensure it's a proper JSON array
    if not fixed_content.strip().startswith('['):
        fixed_content = '[\n' + fixed_content
    if not fixed_content.strip().endswith(']'):
        # Remove trailing comma and add ]
        fixed_content = fixed_content.rstrip().rstrip(',') + '\n]'
    
    try:
        all_data = json.loads(fixed_content)
        print(f"Successfully parsed {len(all_data)} questions from preproff_m2.txt")
        
        # Filter KGMC questions
        kgmc_questions = []
        for item in all_data:
            if item.get('id', '').upper() == 'KGMC':
                q = {
                    'text': item['question'].strip(),
                    'options': normalize_options(item['options']),
                    'correct_index': normalize_answer(item['answer']),
                    'explanation': item.get('explanation', '').strip(),
                    'block': 'm2',
                    'college': 'kgmc',
                    'year': '2023'
                }
                kgmc_questions.append(q)
        
        print(f"Found {len(kgmc_questions)} KGMC M2 2023 questions")
        
        if kgmc_questions:
            # Create the encrypted file
            sql_lines = [generate_sql_insert(q) for q in kgmc_questions]
            sql_content = '\n'.join(sql_lines)
            
            output_path = os.path.join(QBANKS_DIR, 'kgmc M2.enc')
            encrypted = xor_encrypt(sql_content, ENCRYPTION_KEY)
            with open(output_path, 'wb') as f:
                f.write(encrypted)
            
            print(f"✓ Created kgmc M2.enc with {len(kgmc_questions)} questions")
    
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        print("Trying alternative parsing method...")
        
        # Alternative: Use regex to extract KGMC questions
        # Find blocks of JSON that contain "KGMC"
        kgmc_pattern = r'\{\s*"id"\s*:\s*"KGMC"\s*,[^}]+?(?:"explanation"\s*:\s*"[^"]*")\s*\}'
        
        matches = re.findall(kgmc_pattern, content, re.DOTALL)
        print(f"Found {len(matches)} potential KGMC question blocks via regex")
        
        kgmc_questions = []
        for match in matches:
            try:
                # Try to parse each match
                obj = json.loads(match)
                q = {
                    'text': obj['question'].strip(),
                    'options': normalize_options(obj['options']),
                    'correct_index': normalize_answer(obj['answer']),
                    'explanation': obj.get('explanation', '').strip(),
                    'block': 'm2',
                    'college': 'kgmc',
                    'year': '2023'
                }
                kgmc_questions.append(q)
            except:
                pass
        
        print(f"Successfully parsed {len(kgmc_questions)} KGMC questions")
        
        if kgmc_questions:
            sql_lines = [generate_sql_insert(q) for q in kgmc_questions]
            sql_content = '\n'.join(sql_lines)
            
            output_path = os.path.join(QBANKS_DIR, 'kgmc M2.enc')
            encrypted = xor_encrypt(sql_content, ENCRYPTION_KEY)
            with open(output_path, 'wb') as f:
                f.write(encrypted)
            
            print(f"✓ Created kgmc M2.enc with {len(kgmc_questions)} questions")

if __name__ == '__main__':
    main()
