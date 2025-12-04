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

def extract_all_json_arrays(content):
    """Find and parse all JSON arrays in the content, even if embedded."""
    arrays = []
    
    # First, try to split by array boundaries
    # Look for patterns like ][  or ][ which indicate concatenated arrays
    # Also handle ```json markers
    
    # Remove code block markers
    content = content.replace('```json', '')
    content = content.replace('```', '')
    
    # Find all [ positions that start an array
    in_string = False
    escape = False
    array_starts = []
    
    for i, char in enumerate(content):
        if escape:
            escape = False
            continue
        if char == '\\':
            escape = True
            continue
        if char == '"':
            in_string = not in_string
            continue
        if not in_string:
            if char == '[':
                array_starts.append(i)
    
    print(f"Found {len(array_starts)} potential array starts")
    
    # Try to parse each array
    for start in array_starts:
        # Find matching ]
        depth = 0
        in_str = False
        esc = False
        for i in range(start, len(content)):
            if esc:
                esc = False
                continue
            char = content[i]
            if char == '\\':
                esc = True
                continue
            if char == '"':
                in_str = not in_str
                continue
            if not in_str:
                if char == '[':
                    depth += 1
                elif char == ']':
                    depth -= 1
                    if depth == 0:
                        try:
                            arr_text = content[start:i+1]
                            arr = json.loads(arr_text)
                            if isinstance(arr, list) and len(arr) > 0:
                                arrays.append(arr)
                                print(f"  Parsed array from position {start} with {len(arr)} items")
                        except json.JSONDecodeError as e:
                            # Array couldn't be parsed - may have embedded objects
                            pass
                        break
    
    return arrays

def parse_questions_brute_force(content):
    """Parse all question objects using a more aggressive approach."""
    questions = []
    
    # Remove code block markers that might interfere
    content = content.replace('```json', '\n')
    content = content.replace('```', '\n')
    
    # Find all question objects by looking for the pattern
    pattern = r'"id"\s*:\s*"([^"]+)"[^}]*?"block"\s*:\s*"([^"]+)"[^}]*?"year"\s*:\s*"([^"]+)"[^}]*?"question"\s*:\s*"'
    
    # Iterate through finding { ... } blocks
    i = 0
    while i < len(content):
        if content[i] == '{':
            depth = 1
            start = i
            in_string = False
            escape = False
            j = i + 1
            
            while j < len(content) and depth > 0:
                char = content[j]
                if escape:
                    escape = False
                    j += 1
                    continue
                if char == '\\':
                    escape = True
                    j += 1
                    continue
                if char == '"':
                    in_string = not in_string
                    j += 1
                    continue
                if not in_string:
                    if char == '{':
                        depth += 1
                    elif char == '}':
                        depth -= 1
                j += 1
            
            if depth == 0:
                obj_text = content[start:j]
                try:
                    obj = json.loads(obj_text)
                    if 'question' in obj and 'options' in obj and 'id' in obj:
                        questions.append(obj)
                except:
                    pass
            i = j
        else:
            i += 1
    
    return questions

key = "SUPERSIX_SECURE_KEY_2025"
input_file = "2023_preproffs/preproff_j.txt"
output_dir = "public/qbanks"

print("Extracting ALL KMC Block J questions (robust method)...")
print("=" * 60)

# Read entire file
with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"File size: {len(content)} characters")

# Parse all question objects
questions = parse_questions_brute_force(content)
print(f"\nTotal questions found: {len(questions)}")

# Count by college
college_counts = {}
for q in questions:
    college = q.get('id', 'unknown').upper()
    college_counts[college] = college_counts.get(college, 0) + 1

print("\nQuestions by college:")
for col, cnt in sorted(college_counts.items()):
    print(f"  {col}: {cnt}")

# Filter for KMC Block J
kmc_questions = [q for q in questions if q.get('id', '').upper() == 'KMC']
print(f"\nAll KMC questions: {len(kmc_questions)}")

# Filter Block J
kmc_j_questions = [q for q in kmc_questions if q.get('block', '').lower() == 'j']
print(f"KMC Block J questions: {len(kmc_j_questions)}")

# Remove duplicates based on question text
seen = {}
unique_kmc = []
for q in kmc_j_questions:
    q_text = q.get('question', '')
    q_normalized = ' '.join(q_text.lower().split())[:150]
    
    if q_normalized not in seen:
        seen[q_normalized] = True
        unique_kmc.append(q)

print(f"After deduplication: {len(unique_kmc)}")

# Fix the typo in the specific question
typo_fixed = False
for q in unique_kmc:
    if 'bernatir entenhalitit' in q.get('question', '').lower():
        print("\nFixing typo: 'bernatir entenhalitit' -> 'Herpes simplex encephalitis'")
        q['question'] = q['question'].replace('bernatir entenhalitit', 'Herpes simplex encephalitis')
        q['question'] = q['question'].replace('Is relevant microscopl', 'is the relevant microscopic')
        # Also fix explanation
        if "Assuming 'bernatir entenhalitit'" in q.get('explanation', ''):
            q['explanation'] = q['explanation'].replace("Assuming 'bernatir entenhalitit' is a typographical error for 'herpetic encephalitis' (caused by Herpes Simplex Virus),", "For Herpes simplex encephalitis (caused by Herpes Simplex Virus),")
        typo_fixed = True

if typo_fixed:
    print("Typo fixed!")
else:
    print("\nNote: Could not find the typo question to fix")

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

print(f"\n✅ Saved {len(unique_kmc)} questions to {output_file}")

# Verify
with open(output_file, 'rb') as f:
    encrypted = f.read()
decrypted = xor_encrypt_decrypt(encrypted, key).decode('utf-8')
count = decrypted.count('INSERT INTO preproff')
print(f"Verification: {count} INSERT statements in encrypted file")
