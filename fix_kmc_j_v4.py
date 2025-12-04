import json
import re
import os

def xor_encrypt_decrypt(data, key):
    """Encrypts or decrypts data using XOR with the given key."""
    key_bytes = key.encode('utf-8')
    key_len = len(key_bytes)
    result = bytearray(len(data))
    for i in range(len(data)):
        result[i] = data[i] ^ key_bytes[i % key_len]
    return result

def create_sql_insert(question, options, correct_index, explanation, block, college, year):
    """Create SQL INSERT statement."""
    q = question.replace("'", "''")
    exp = explanation.replace("'", "''")
    # Clean options - remove a., b., A., B., etc. prefixes
    clean_opts = []
    for opt in options:
        cleaned = re.sub(r'^[a-eA-E][\.\)\:]?\s*', '', opt)
        clean_opts.append(cleaned)
    opts_json = json.dumps(clean_opts).replace("'", "''")
    return f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{q}', '{opts_json}', {correct_index}, '{exp}', '', '', 'Medium', '{block}', '{college.upper()}', '{year}');"

def extract_all_questions(filepath):
    """Extract all questions from a malformed JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    questions = []
    
    # Find the proper JSON array (starting with '[' on its own line)
    lines = content.split('\n')
    array_start_line = None
    for i, line in enumerate(lines):
        if line.strip() == '[':
            array_start_line = i
            break
    
    if array_start_line:
        print(f"Found proper array at line {array_start_line + 1}")
        # Parse the array part
        array_content = '\n'.join(lines[array_start_line:])
        try:
            arr = json.loads(array_content)
            questions.extend([q for q in arr if isinstance(q, dict) and 'question' in q])
            print(f"  Parsed {len(questions)} questions from proper array")
        except json.JSONDecodeError as e:
            print(f"  Array parse failed: {e}")
    
    # Parse the malformed first part (objects with commas between them)
    if array_start_line:
        first_part = '\n'.join(lines[:array_start_line])
    else:
        first_part = content
    
    # Try wrapping in [ ] to make it valid
    wrapped = '[' + first_part.strip().rstrip(',') + ']'
    try:
        arr = json.loads(wrapped)
        new_qs = [q for q in arr if isinstance(q, dict) and 'question' in q]
        questions.extend(new_qs)
        print(f"Parsed {len(new_qs)} questions from first section (wrapped)")
    except json.JSONDecodeError:
        # Try parsing individual objects
        print("Parsing individual objects from first section...")
        depth = 0
        start = -1
        for i, char in enumerate(first_part):
            if char == '{':
                if depth == 0:
                    start = i
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0 and start != -1:
                    try:
                        obj = json.loads(first_part[start:i+1])
                        if 'question' in obj and 'options' in obj:
                            questions.append(obj)
                    except:
                        pass
                    start = -1
        print(f"  Parsed {len(questions)} questions from individual objects")
    
    return questions

key = "SUPERSIX_SECURE_KEY_2025"
input_file = "2023_preproffs/preproff_j.txt"
output_dir = "public/qbanks"

print("Extracting ALL Block J questions...")
print("=" * 60)

# Parse all questions
questions = extract_all_questions(input_file)
print(f"\nTotal questions extracted: {len(questions)}")

# Count by college
college_counts = {}
for q in questions:
    college = q.get('id', 'unknown').upper()
    college_counts[college] = college_counts.get(college, 0) + 1

print("\nQuestions by college:")
for col, cnt in sorted(college_counts.items()):
    print(f"  {col}: {cnt}")

# Filter for KMC Block J
kmc_j_questions = [q for q in questions if q.get('id', '').upper() == 'KMC' and q.get('block', '').lower() == 'j']
print(f"\nKMC Block J questions: {len(kmc_j_questions)}")

# Remove duplicates
seen = {}
unique_kmc = []
for q in kmc_j_questions:
    q_text = q.get('question', '')
    q_normalized = ' '.join(q_text.lower().split())[:150]
    
    if q_normalized not in seen:
        seen[q_normalized] = True
        unique_kmc.append(q)

print(f"After deduplication: {len(unique_kmc)}")

# Fix the typo
for q in unique_kmc:
    if 'bernatir entenhalitit' in q.get('question', '').lower():
        print("\nFixing typo: 'bernatir entenhalitit' -> 'Herpes simplex encephalitis'")
        q['question'] = q['question'].replace('bernatir entenhalitit', 'Herpes simplex encephalitis')
        q['question'] = q['question'].replace('Is relevant microscopl', 'is the relevant microscopic')
        if "Assuming 'bernatir entenhalitit'" in q.get('explanation', ''):
            q['explanation'] = q['explanation'].replace("Assuming 'bernatir entenhalitit' is a typographical error for 'herpetic encephalitis' (caused by Herpes Simplex Virus),", "For Herpes simplex encephalitis (caused by Herpes Simplex Virus),")

# Create SQL statements
sql_lines = []
for q in unique_kmc:
    answer_map = {'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4}
    correct_index = answer_map.get(q.get('answer', 'a').lower(), 0)
    sql = create_sql_insert(
        q.get('question', ''),
        q.get('options', []),
        correct_index,
        q.get('explanation', ''),
        'J',
        'KMC',
        '2023'
    )
    sql_lines.append(sql)

# Encrypt and save
sql_content = '\n'.join(sql_lines)
encrypted_data = xor_encrypt_decrypt(sql_content.encode('utf-8'), key)

output_file = os.path.join(output_dir, "kmc J.enc")
with open(output_file, 'wb') as f:
    f.write(encrypted_data)

print(f"\n✅ Saved {len(unique_kmc)} KMC Block J questions to {output_file}")

# Verify
with open(output_file, 'rb') as f:
    encrypted = f.read()
decrypted = xor_encrypt_decrypt(encrypted, key).decode('utf-8')
count = decrypted.count('INSERT INTO preproff')
print(f"Verification: {count} INSERT statements in encrypted file")
