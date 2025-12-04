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
    qid_lower = qid.lower().strip()
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

def remove_duplicates(questions_list):
    """Remove duplicate questions based on normalized question text."""
    seen = {}
    unique = []
    for q in questions_list:
        # Normalize: lowercase, remove extra spaces, first 150 chars
        q_text = q.get('question', '')
        q_normalized = ' '.join(q_text.lower().split())[:150]
        
        if q_normalized not in seen:
            seen[q_normalized] = True
            unique.append(q)
    return unique

key = "SUPERSIX_SECURE_KEY_2025"
output_dir = "public/qbanks"

# ==================== PROCESS BLOCK L (Remove duplicates) ====================
print("=" * 60)
print("PROCESSING BLOCK L - REMOVING DUPLICATES")
print("=" * 60)

questions_l = parse_questions_from_file('Lpreproff.txt')
print(f"Total questions parsed from Lpreproff.txt: {len(questions_l)}")

# Group by college
colleges_l = {'wmc': [], 'gmc': [], 'kgmc': [], 'nwsm': [], 'kmc': []}

for q in questions_l:
    college = get_college_from_id(q.get('id', ''))
    if college in colleges_l:
        colleges_l[college].append(q)

print("\nBefore removing duplicates:")
for col in ['wmc', 'gmc', 'kgmc', 'nwsm', 'kmc']:
    print(f"  {col.upper()}: {len(colleges_l[col])}")

# Remove duplicates from each college
for college in colleges_l:
    colleges_l[college] = remove_duplicates(colleges_l[college])

print("\nAfter removing duplicates:")
for col in ['wmc', 'gmc', 'kgmc', 'nwsm', 'kmc']:
    print(f"  {col.upper()}: {len(colleges_l[col])}")

# Create encrypted files for Block L
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
    
    print(f"  {college.upper()}: {len(qs)} unique questions -> {output_file}")

print("\n✅ Block L files recreated without duplicates!")

# Now verify
print("\n" + "=" * 60)
print("VERIFICATION - Checking all files for duplicates")
print("=" * 60)

files = [f for f in os.listdir(output_dir) if f.endswith('.enc')]
total_duplicates = 0

for filename in sorted(files):
    filepath = os.path.join(output_dir, filename)
    with open(filepath, 'rb') as f:
        encrypted = f.read()
    decrypted = xor_encrypt_decrypt(encrypted, key).decode('utf-8')
    
    # Extract question texts
    questions = re.findall(r"VALUES \('([^']+)'", decrypted)
    
    # Find duplicates
    seen = {}
    duplicates = 0
    for q in questions:
        q_normalized = ' '.join(q.lower().split())[:150]
        if q_normalized in seen:
            duplicates += 1
        else:
            seen[q_normalized] = True
    
    if duplicates > 0:
        print(f"❌ {filename}: {len(questions)} total, {duplicates} duplicates")
        total_duplicates += duplicates
    else:
        print(f"✅ {filename}: {len(questions)} questions, all unique")

print(f"\nTotal duplicates remaining: {total_duplicates}")
