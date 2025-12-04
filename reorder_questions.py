import json
import re
import os

def xor_encrypt_decrypt(data, key):
    key_bytes = key.encode('utf-8')
    key_len = len(key_bytes)
    result = bytearray(len(data))
    for i in range(len(data)):
        result[i] = data[i] ^ key_bytes[i % key_len]
    return result

# Read the original file
with open('preproff_k.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract all questions
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
                if 'id' in obj:
                    questions.append(obj)
            except:
                pass
            start = -1

print(f"Total questions in preproff_k.txt: {len(questions)}")

# Group by college
colleges_data = {'wmc': [], 'gmc': [], 'kgmc': [], 'nwsm': [], 'kmc': []}

for q in questions:
    qid = q.get('id', '').lower()
    if qid.startswith('wmc'):
        colleges_data['wmc'].append(q)
    elif qid.startswith('gmc'):
        colleges_data['gmc'].append(q)
    elif qid.startswith('kgmc'):
        colleges_data['kgmc'].append(q)
    elif qid.startswith('nwsm'):
        colleges_data['nwsm'].append(q)
    elif qid.startswith('kmc'):
        colleges_data['kmc'].append(q)

# Sort each college by numeric ID
def get_num(qid):
    match = re.search(r'(\d+)', qid)
    return int(match.group(1)) if match else 0

for college in colleges_data:
    colleges_data[college].sort(key=lambda q: get_num(q.get('id', '')))

# Create SQL format and encrypt
key = "SUPERSIX_SECURE_KEY_2025"
output_dir = "public/qbanks"

def create_sql_insert(question, options, correct_index, explanation, block, college, year):
    q = question.replace("'", "''")
    exp = explanation.replace("'", "''")
    # Clean options
    clean_opts = []
    for opt in options:
        cleaned = re.sub(r'^[a-e][\.\)\:]?\s*', '', opt, flags=re.IGNORECASE)
        clean_opts.append(cleaned)
    opts_json = json.dumps(clean_opts).replace("'", "''")
    return f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{q}', '{opts_json}', {correct_index}, '{exp}', '', '', 'Medium', '{block}', '{college.upper()}', '{year}');"

# Process each college
for college, qs in colleges_data.items():
    if len(qs) == 0:
        continue
    
    print(f"\n{college.upper()}: {len(qs)} questions")
    print(f"  First 5 IDs: {[q['id'] for q in qs[:5]]}")
    print(f"  Last 5 IDs: {[q['id'] for q in qs[-5:]]}")
    
    # Create SQL statements
    sql_lines = []
    for q in qs:
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
    
    # Save encrypted file
    sql_content = '\n'.join(sql_lines)
    encrypted_data = xor_encrypt_decrypt(sql_content.encode('utf-8'), key)
    
    output_file = os.path.join(output_dir, f"{college} K.enc")
    with open(output_file, 'wb') as f:
        f.write(encrypted_data)
    
    print(f"  Saved: {output_file} ({len(encrypted_data)} bytes)")

print("\n✅ All files recreated with questions in correct order!")
