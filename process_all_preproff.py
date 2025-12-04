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
    # Clean options - remove a., b., etc. prefixes
    clean_opts = []
    for opt in options:
        cleaned = re.sub(r'^[a-e][\.\)\:]?\s*', '', opt, flags=re.IGNORECASE)
        clean_opts.append(cleaned)
    opts_json = json.dumps(clean_opts).replace("'", "''")
    return f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{q}', '{opts_json}', {correct_index}, '{exp}', '', '', 'Medium', '{block}', '{college.upper()}', '{year}');"

def parse_questions_from_file(filepath):
    """Parse questions from a JSON-like file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    questions = []
    depth = 0
    start = -1
    for i, char in enumerate(content):
        if char == '{':
            if depth == 0:
                start = i
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0 and start != -1:
                try:
                    obj = json.loads(content[start:i+1])
                    if 'question' in obj:
                        questions.append(obj)
                except:
                    pass
                start = -1
    return questions

def get_college_from_id(qid):
    """Extract college name from question ID."""
    qid_lower = qid.lower()
    if qid_lower.startswith('wmc'):
        return 'wmc'
    elif qid_lower.startswith('gmc'):
        return 'gmc'
    elif qid_lower.startswith('kgmc'):
        return 'kgmc'
    elif qid_lower.startswith('nwsm'):
        return 'nwsm'
    elif qid_lower.startswith('kmc'):
        return 'kmc'
    return qid_lower  # For Block L where id is just the college name

key = "SUPERSIX_SECURE_KEY_2025"
output_dir = "public/qbanks"

# ==================== PROCESS BLOCK K ====================
print("=" * 50)
print("PROCESSING BLOCK K")
print("=" * 50)

questions_k = parse_questions_from_file('preproff_k.txt')
print(f"Total questions parsed from preproff_k.txt: {len(questions_k)}")

# Group by college and remove duplicates based on question text
colleges_k = {'wmc': {}, 'gmc': {}, 'kgmc': {}, 'nwsm': {}, 'kmc': {}}

for q in questions_k:
    college = get_college_from_id(q.get('id', ''))
    if college in colleges_k:
        # Use first 100 chars of question as key to detect duplicates
        q_key = q.get('question', '')[:100]
        if q_key not in colleges_k[college]:
            colleges_k[college][q_key] = q

# Convert back to lists (unique questions only)
for college in colleges_k:
    colleges_k[college] = list(colleges_k[college].values())

# Expected counts from user
expected_k = {'wmc': 114, 'gmc': 109, 'nwsm': 111, 'kmc': 111, 'kgmc': 107}

print("\nBlock K - Before adjustment:")
for col in ['wmc', 'gmc', 'kgmc', 'nwsm', 'kmc']:
    actual = len(colleges_k[col])
    expected = expected_k[col]
    status = "✓" if actual == expected else f"(expected {expected})"
    print(f"  {col.upper()}: {actual} {status}")

# Create encrypted files for Block K with proper numbering (starting from 1)
print("\nCreating Block K encrypted files...")
for college, qs in colleges_k.items():
    if len(qs) == 0:
        continue
    
    sql_lines = []
    for i, q in enumerate(qs, 1):
        answer_map = {'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4}
        correct_index = answer_map.get(q.get('answer', 'a').lower(), 0)
        sql = create_sql_insert(
            q.get('question', ''),
            q.get('options', []),
            correct_index,
            q.get('explanation', ''),
            'K',
            college,
            '2023'
        )
        sql_lines.append(sql)
    
    sql_content = '\n'.join(sql_lines)
    encrypted_data = xor_encrypt_decrypt(sql_content.encode('utf-8'), key)
    
    output_file = os.path.join(output_dir, f"{college} K.enc")
    with open(output_file, 'wb') as f:
        f.write(encrypted_data)
    
    print(f"  {college.upper()}: {len(qs)} questions -> {output_file}")

# ==================== PROCESS BLOCK L ====================
print("\n" + "=" * 50)
print("PROCESSING BLOCK L")
print("=" * 50)

questions_l = parse_questions_from_file('Lpreproff.txt')
print(f"Total questions parsed from Lpreproff.txt: {len(questions_l)}")

# Group by college (id field contains just the college name like "wmc", "gmc", etc.)
colleges_l = {'wmc': [], 'gmc': [], 'kgmc': [], 'nwsm': [], 'kmc': []}

for q in questions_l:
    college = q.get('id', '').lower().strip()
    if college in colleges_l:
        colleges_l[college].append(q)

print("\nBlock L - Questions per college:")
for col in ['wmc', 'gmc', 'kgmc', 'nwsm', 'kmc']:
    print(f"  {col.upper()}: {len(colleges_l[col])}")

# Create encrypted files for Block L with proper numbering
print("\nCreating Block L encrypted files...")
for college, qs in colleges_l.items():
    if len(qs) == 0:
        print(f"  {college.upper()}: No questions, skipping")
        continue
    
    sql_lines = []
    for i, q in enumerate(qs, 1):
        answer_map = {'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4}
        correct_index = answer_map.get(q.get('answer', 'a').lower(), 0)
        sql = create_sql_insert(
            q.get('question', ''),
            q.get('options', []),
            correct_index,
            q.get('explanation', ''),
            'L',
            college,
            '2023'
        )
        sql_lines.append(sql)
    
    sql_content = '\n'.join(sql_lines)
    encrypted_data = xor_encrypt_decrypt(sql_content.encode('utf-8'), key)
    
    output_file = os.path.join(output_dir, f"{college} L.enc")
    with open(output_file, 'wb') as f:
        f.write(encrypted_data)
    
    print(f"  {college.upper()}: {len(qs)} questions -> {output_file}")

print("\n" + "=" * 50)
print("SUMMARY")
print("=" * 50)

# List all files in qbanks
print("\nFiles in public/qbanks/:")
for f in sorted(os.listdir(output_dir)):
    if f.endswith('.enc'):
        filepath = os.path.join(output_dir, f)
        size = os.path.getsize(filepath)
        print(f"  {f} ({size} bytes)")

print("\n✅ All preproff files processed successfully!")
