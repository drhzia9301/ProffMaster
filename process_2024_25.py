#!/usr/bin/env python3
"""
Process 2024-25 preproff files into encrypted .enc files.
Handles both JSON and plain text formats.
"""

import json
import os
import re
from pathlib import Path

ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025"
SOURCE_DIR = r"c:\Users\haroo\Desktop\ProffMaster\2023_preproffs\2024-25"
OUTPUT_DIR = r"c:\Users\haroo\Desktop\ProffMaster\public\qbanks"

def xor_encrypt(data: str, key: str) -> bytes:
    """XOR encrypt the data with the given key."""
    key_bytes = key.encode('utf-8')
    data_bytes = data.encode('utf-8')
    encrypted = bytes([data_bytes[i] ^ key_bytes[i % len(key_bytes)] for i in range(len(data_bytes))])
    return encrypted

def normalize_answer(answer: str) -> int:
    """Convert answer letter to 0-indexed number."""
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
    return 0  # Default

def normalize_options(options: list) -> list:
    """Clean option text by removing letter prefixes."""
    normalized = []
    for opt in options:
        # Remove prefixes like "A. ", "a) ", "A) ", etc.
        cleaned = re.sub(r'^[A-Ea-e][\.\)]\s*', '', opt.strip())
        normalized.append(cleaned)
    return normalized

def normalize_college(college_id: str) -> str:
    """Normalize college ID to standard format."""
    college_id = college_id.lower().strip()
    if college_id in ['kmc', 'k']:
        return 'kmc'
    elif college_id in ['wmc', 'w']:
        return 'wmc'
    elif college_id in ['gmc', 'g']:
        return 'gmc'
    elif college_id in ['kgmc']:
        return 'kgmc'
    elif college_id in ['nwsm', 'n']:
        return 'nwsm'
    elif college_id in ['l']:
        return 'kmc'  # L prefix files are usually KMC
    return college_id

def parse_json_file(filepath: str, override_college: str = None) -> list:
    """Parse JSON format file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = []
    for item in data:
        # Use override_college from filename if provided, otherwise use id from JSON
        college = override_college if override_college else normalize_college(item['id'])
        q = {
            'text': item['question'].strip(),
            'options': normalize_options(item['options']),
            'correct_index': normalize_answer(item['answer']),
            'explanation': item.get('explanation', '').strip(),
            'subject': '',
            'topic': '',
            'difficulty': 'medium',
            'block': item['block'].lower().strip(),
            'college': college,
            'year': str(item['year']).strip()
        }
        questions.append(q)
    return questions

def parse_text_file(filepath: str, block: str, college: str, year: str) -> list:
    """Parse plain text format file (like m2gmc2024.txt)."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    questions = []
    
    # Split by question numbers (e.g., "1.", "2.", "77.")
    pattern = r'(?:^|\n)(\d+)\.\s+'
    parts = re.split(pattern, content)
    
    i = 1
    while i < len(parts) - 1:
        q_num = parts[i]
        q_text = parts[i + 1]
        i += 2
        
        # Find options (a), b), c), d), e) or a., b., etc.)
        option_pattern = r'(?:^|\n)\s*([a-e])[\.\)]\s*(.+?)(?=(?:\n\s*[a-e][\.\)]|\Z))'
        options_matches = re.findall(option_pattern, q_text, re.IGNORECASE | re.DOTALL)
        
        if len(options_matches) >= 2:  # Need at least 2 options for a valid question
            # Extract question text (before options)
            first_option_match = re.search(r'\n\s*[a-e][\.\)]', q_text, re.IGNORECASE)
            if first_option_match:
                question_text = q_text[:first_option_match.start()].strip()
            else:
                question_text = q_text.strip()
            
            options = [opt[1].strip() for opt in options_matches]
            
            # Clean up options - remove extra text that might be after the option
            cleaned_options = []
            for opt in options:
                # Take only the first line if multi-line
                opt_lines = opt.split('\n')
                cleaned = opt_lines[0].strip()
                # Remove trailing numbers from next questions
                cleaned = re.sub(r'\s+\d+$', '', cleaned)
                cleaned_options.append(cleaned)
            
            q = {
                'text': question_text,
                'options': cleaned_options,
                'correct_index': 0,  # Unknown - default to A
                'explanation': '',
                'subject': '',
                'topic': '',
                'difficulty': 'medium',
                'block': block,
                'college': college,
                'year': year
            }
            questions.append(q)
    
    return questions

def escape_sql(text: str) -> str:
    """Escape single quotes for SQL."""
    return text.replace("'", "''")

def generate_sql_inserts(questions: list) -> str:
    """Generate SQL INSERT statements for all questions."""
    inserts = []
    for i, q in enumerate(questions, 1):
        options_json = json.dumps(q['options'])
        sql = f"""INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{escape_sql(q['text'])}', '{escape_sql(options_json)}', {q['correct_index']}, '{escape_sql(q['explanation'])}', '{escape_sql(q['subject'])}', '{escape_sql(q['topic'])}', '{escape_sql(q['difficulty'])}', '{escape_sql(q['block'])}', '{escape_sql(q['college'])}', '{escape_sql(q['year'])}');"""
        inserts.append(sql)
    return '\n'.join(inserts)

def write_encrypted_file(filepath: str, content: str):
    """Write encrypted content to file."""
    encrypted = xor_encrypt(content, ENCRYPTION_KEY)
    with open(filepath, 'wb') as f:
        f.write(encrypted)

def get_file_info(filename: str) -> tuple:
    """Extract block, college, and year from filename like jwmc2024.txt."""
    name = os.path.splitext(filename)[0].lower()
    
    # Pattern: {block}{college}{year}.txt
    # j wmc 2024, k wmc 2025, l gmc 2024, etc.
    match = re.match(r'([jklm][12]?)(wmc|kmc|gmc|kgmc|nwsm)(\d{4})', name)
    if match:
        block = match.group(1)
        # Normalize block names
        if block == 'm1':
            block = 'm1'
        elif block == 'm2':
            block = 'm2'
        college = match.group(2)
        year = match.group(3)
        return block, college, year
    
    return None, None, None

def main():
    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Track all processed questions by (block, college, year)
    all_questions = {}
    
    # List all files in source directory
    source_path = Path(SOURCE_DIR)
    files = list(source_path.glob('*.txt'))
    
    print(f"Found {len(files)} files to process:\n")
    
    for file_path in sorted(files):
        filename = file_path.name
        print(f"Processing: {filename}")
        
        block, college, year = get_file_info(filename)
        if not block:
            print(f"  ⚠ Could not parse filename: {filename}")
            continue
        
        print(f"  Block: {block.upper()}, College: {college.upper()}, Year: {year}")
        
        # Try to parse as JSON first, using college from filename
        try:
            questions = parse_json_file(str(file_path), override_college=college)
            print(f"  ✓ Parsed as JSON: {len(questions)} questions")
        except json.JSONDecodeError:
            # Fall back to text parsing
            questions = parse_text_file(str(file_path), block, college, year)
            print(f"  ✓ Parsed as text: {len(questions)} questions (no answers available)")
        
        key = (block, college, year)
        if key in all_questions:
            all_questions[key].extend(questions)
        else:
            all_questions[key] = questions
    
    print("\n" + "="*60 + "\n")
    print("Generating encrypted files:\n")
    
    # Group questions by (block, college) and combine years
    grouped = {}
    for (block, college, year), questions in all_questions.items():
        key = (block, college)
        if key not in grouped:
            grouped[key] = []
        grouped[key].extend(questions)
    
    # Write encrypted files
    for (block, college), questions in sorted(grouped.items()):
        # Output filename: "wmc J 2024.enc" or add to existing
        output_name = f"{college} {block.upper()}.enc"
        output_path = os.path.join(OUTPUT_DIR, output_name)
        
        # Check if file exists - if so, we need to merge
        existing_questions = []
        if os.path.exists(output_path):
            # Read and decrypt existing file
            with open(output_path, 'rb') as f:
                encrypted_data = f.read()
            key_bytes = ENCRYPTION_KEY.encode('utf-8')
            decrypted = bytes([encrypted_data[i] ^ key_bytes[i % len(key_bytes)] for i in range(len(encrypted_data))])
            existing_content = decrypted.decode('utf-8')
            
            # Count existing questions
            existing_count = existing_content.count('INSERT INTO preproff')
            print(f"  Existing {output_name}: {existing_count} questions")
            
            # Generate SQL with separate year markers for new questions
            new_years = set(q['year'] for q in questions)
            print(f"  Adding {len(questions)} new questions from year(s): {', '.join(sorted(new_years))}")
            
            # Append to existing content
            new_sql = generate_sql_inserts(questions)
            final_content = existing_content + '\n' + new_sql
        else:
            new_sql = generate_sql_inserts(questions)
            final_content = new_sql
        
        # Write encrypted file
        write_encrypted_file(output_path, final_content)
        
        total_questions = final_content.count('INSERT INTO preproff')
        years = set(q['year'] for q in questions)
        if existing_questions:
            years.update(set(q['year'] for q in existing_questions))
        
        print(f"  ✓ {output_name}: Total {total_questions} questions")
    
    print("\n" + "="*60)
    print("\nSummary of 2024-25 files:")
    print("-"*40)
    
    total = 0
    for (block, college, year), questions in sorted(all_questions.items()):
        print(f"  Block {block.upper()} | {college.upper()} | {year}: {len(questions)} questions")
        total += len(questions)
    
    print("-"*40)
    print(f"  Total new questions: {total}")

if __name__ == '__main__':
    main()
