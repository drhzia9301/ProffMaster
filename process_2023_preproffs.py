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
    qid_lower = qid.lower().strip()
    if 'wmc' in qid_lower:
        return 'wmc'
    elif 'gmc' in qid_lower:
        return 'gmc'
    elif 'kgmc' in qid_lower:
        return 'kgmc'
    elif 'nwsm' in qid_lower:
        return 'nwsm'
    elif 'kmc' in qid_lower:
        return 'kmc'
    return qid_lower

def remove_duplicates(questions_list):
    """Remove duplicate questions based on normalized question text."""
    seen = {}
    unique = []
    for q in questions_list:
        q_text = q.get('question', '')
        q_normalized = ' '.join(q_text.lower().split())[:150]
        
        if q_normalized not in seen:
            seen[q_normalized] = True
            unique.append(q)
    return unique

key = "SUPERSIX_SECURE_KEY_2025"
output_dir = "public/qbanks"
input_dir = "2023_preproffs"

# ==================== PROCESS BLOCK J ====================
print("=" * 60)
print("PROCESSING BLOCK J (2023)")
print("=" * 60)

questions_j = parse_questions_from_file(os.path.join(input_dir, 'preproff_j.txt'))
print(f"Total questions parsed: {len(questions_j)}")

# Group by college
colleges_j = {'wmc': [], 'gmc': [], 'kgmc': [], 'nwsm': [], 'kmc': []}
for q in questions_j:
    college = get_college_from_id(q.get('id', ''))
    if college in colleges_j:
        colleges_j[college].append(q)

# Remove duplicates
for college in colleges_j:
    colleges_j[college] = remove_duplicates(colleges_j[college])

print("\nBlock J questions per college:")
for col in ['wmc', 'gmc', 'kgmc', 'nwsm', 'kmc']:
    print(f"  {col.upper()}: {len(colleges_j[col])}")

# Create encrypted files
print("\nCreating Block J encrypted files...")
for college, qs in colleges_j.items():
    if len(qs) == 0:
        print(f"  {college.upper()}: No questions, skipping")
        continue
    
    sql_lines = []
    for q in qs:
        answer_map = {'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4}
        correct_index = answer_map.get(q.get('answer', 'a').lower(), 0)
        sql = create_sql_insert(
            q.get('question', ''),
            q.get('options', []),
            correct_index,
            q.get('explanation', ''),
            'J',
            college,
            '2023'
        )
        sql_lines.append(sql)
    
    sql_content = '\n'.join(sql_lines)
    encrypted_data = xor_encrypt_decrypt(sql_content.encode('utf-8'), key)
    
    output_file = os.path.join(output_dir, f"{college} J.enc")
    with open(output_file, 'wb') as f:
        f.write(encrypted_data)
    
    print(f"  {college.upper()}: {len(qs)} questions -> {output_file}")

# ==================== PROCESS BLOCK M1 ====================
print("\n" + "=" * 60)
print("PROCESSING BLOCK M1 (2023)")
print("=" * 60)

# M1 has separate files per college
m1_files = {
    'wmc': 'm1wmc.txt',
    'gmc': 'm1gmc.txt',
    'kgmc': 'm1kgmc.txt',
    'kmc': 'm1kmc.txt'
}

colleges_m1 = {}
for college, filename in m1_files.items():
    filepath = os.path.join(input_dir, 'preproff_m1', filename)
    if os.path.exists(filepath):
        qs = parse_questions_from_file(filepath)
        colleges_m1[college] = remove_duplicates(qs)
    else:
        colleges_m1[college] = []

print("\nBlock M1 questions per college:")
for col in ['wmc', 'gmc', 'kgmc', 'kmc']:
    print(f"  {col.upper()}: {len(colleges_m1.get(col, []))}")

# Create encrypted files
print("\nCreating Block M1 encrypted files...")
for college, qs in colleges_m1.items():
    if len(qs) == 0:
        print(f"  {college.upper()}: No questions, skipping")
        continue
    
    sql_lines = []
    for q in qs:
        answer_map = {'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4}
        correct_index = answer_map.get(q.get('answer', 'a').lower(), 0)
        sql = create_sql_insert(
            q.get('question', ''),
            q.get('options', []),
            correct_index,
            q.get('explanation', ''),
            'M1',
            college,
            '2023'
        )
        sql_lines.append(sql)
    
    sql_content = '\n'.join(sql_lines)
    encrypted_data = xor_encrypt_decrypt(sql_content.encode('utf-8'), key)
    
    output_file = os.path.join(output_dir, f"{college} M1.enc")
    with open(output_file, 'wb') as f:
        f.write(encrypted_data)
    
    print(f"  {college.upper()}: {len(qs)} questions -> {output_file}")

# ==================== PROCESS BLOCK M2 ====================
print("\n" + "=" * 60)
print("PROCESSING BLOCK M2 (2023)")
print("=" * 60)

questions_m2 = parse_questions_from_file(os.path.join(input_dir, 'preproff_m2.txt'))
print(f"Total questions parsed: {len(questions_m2)}")

# Group by college
colleges_m2 = {'wmc': [], 'gmc': [], 'kgmc': [], 'nwsm': [], 'kmc': []}
for q in questions_m2:
    college = get_college_from_id(q.get('id', ''))
    if college in colleges_m2:
        colleges_m2[college].append(q)

# Remove duplicates
for college in colleges_m2:
    colleges_m2[college] = remove_duplicates(colleges_m2[college])

print("\nBlock M2 questions per college:")
for col in ['wmc', 'gmc', 'kgmc', 'nwsm', 'kmc']:
    print(f"  {col.upper()}: {len(colleges_m2[col])}")

# Create encrypted files
print("\nCreating Block M2 encrypted files...")
for college, qs in colleges_m2.items():
    if len(qs) == 0:
        print(f"  {college.upper()}: No questions, skipping")
        continue
    
    sql_lines = []
    for q in qs:
        answer_map = {'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4}
        correct_index = answer_map.get(q.get('answer', 'a').lower(), 0)
        sql = create_sql_insert(
            q.get('question', ''),
            q.get('options', []),
            correct_index,
            q.get('explanation', ''),
            'M2',
            college,
            '2023'
        )
        sql_lines.append(sql)
    
    sql_content = '\n'.join(sql_lines)
    encrypted_data = xor_encrypt_decrypt(sql_content.encode('utf-8'), key)
    
    output_file = os.path.join(output_dir, f"{college} M2.enc")
    with open(output_file, 'wb') as f:
        f.write(encrypted_data)
    
    print(f"  {college.upper()}: {len(qs)} questions -> {output_file}")

# ==================== SUMMARY ====================
print("\n" + "=" * 60)
print("SUMMARY - All Files in public/qbanks/")
print("=" * 60)

files = sorted([f for f in os.listdir(output_dir) if f.endswith('.enc')])
for f in files:
    filepath = os.path.join(output_dir, f)
    size = os.path.getsize(filepath)
    
    # Decrypt to count questions
    with open(filepath, 'rb') as file:
        encrypted = file.read()
    decrypted = xor_encrypt_decrypt(encrypted, key).decode('utf-8')
    count = decrypted.count('INSERT INTO preproff')
    
    print(f"  {f}: {count} questions ({size} bytes)")

print("\n✅ All 2023 preproff files processed successfully!")
