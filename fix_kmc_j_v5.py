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

def extract_questions_from_malformed(filepath):
    """Extract all questions from a heavily malformed JSON file with embedded arrays."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    questions = []
    
    # The file has multiple concatenated sections - some are proper arrays,
    # some are malformed with ```json markers embedded in explanations
    # 
    # Strategy: Use regex to find all well-formed question objects directly
    
    # Pattern to match a question object
    # This is more targeted - look for the full structure
    pattern = r'\{\s*"id"\s*:\s*"([^"]+)"\s*,\s*"block"\s*:\s*"([^"]+)"\s*,\s*"year"\s*:\s*"([^"]+)"\s*,\s*"question"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"options"\s*:\s*\[((?:[^\[\]]|\[(?:[^\[\]]|\[[^\]]*\])*\])*)\]\s*,\s*"answer"\s*:\s*"([^"]+)"\s*,\s*"explanation"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}'
    
    # Simpler approach: find each object by looking for { "id": ... pattern
    # and then manually parse
    
    # Split by the pattern that starts a new question
    object_pattern = r'(?=\{\s*"id"\s*:\s*"[^"]+"\s*,\s*"block"\s*:\s*"[^"]+"\s*,\s*"year"\s*:\s*"[^"]+"\s*,\s*"question")'
    
    parts = re.split(object_pattern, content)
    print(f"Found {len(parts)} potential question blocks")
    
    for part in parts:
        part = part.strip()
        if not part or not part.startswith('{'):
            continue
        
        # Find the end of this object (matching })
        depth = 0
        in_string = False
        escape = False
        end_pos = -1
        
        for i, char in enumerate(part):
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
                if char == '{':
                    depth += 1
                elif char == '}':
                    depth -= 1
                    if depth == 0:
                        end_pos = i + 1
                        break
        
        if end_pos > 0:
            obj_text = part[:end_pos]
            try:
                obj = json.loads(obj_text)
                if 'question' in obj and 'options' in obj:
                    questions.append(obj)
            except json.JSONDecodeError:
                # Try to repair the object
                # Common issue: explanation contains unescaped content
                pass
    
    return questions

def extract_questions_robust(filepath):
    """A more robust extraction that handles embedded JSON."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    questions = []
    
    # Find all JSON arrays in the file
    # Arrays start with [ but we need to handle arrays inside "options"
    
    # First, split the content by ```json markers which indicate new sections
    sections = re.split(r'```(?:json)?', content)
    print(f"Found {len(sections)} sections split by code markers")
    
    for sec_idx, section in enumerate(sections):
        section = section.strip()
        if not section:
            continue
            
        # Check if section starts with [
        if section.startswith('['):
            # This is an array section
            # Find matching ]
            depth = 1
            in_string = False
            escape = False
            end_pos = -1
            
            for i in range(1, len(section)):
                char = section[i]
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
                        depth += 1
                    elif char == ']':
                        depth -= 1
                        if depth == 0:
                            end_pos = i + 1
                            break
            
            if end_pos > 0:
                arr_text = section[:end_pos]
                try:
                    arr = json.loads(arr_text)
                    if isinstance(arr, list):
                        for item in arr:
                            if isinstance(item, dict) and 'question' in item and 'options' in item:
                                questions.append(item)
                        print(f"  Section {sec_idx}: Parsed {len([i for i in arr if 'question' in i])} questions from array")
                except json.JSONDecodeError:
                    pass
        else:
            # Check if there are individual objects
            # Look for { "id": patterns
            depth = 0
            in_string = False
            escape = False
            start = -1
            
            for i, char in enumerate(section):
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
                    if char == '{':
                        if depth == 0:
                            start = i
                        depth += 1
                    elif char == '}':
                        depth -= 1
                        if depth == 0 and start != -1:
                            obj_text = section[start:i+1]
                            try:
                                obj = json.loads(obj_text)
                                if 'question' in obj and 'options' in obj:
                                    questions.append(obj)
                            except json.JSONDecodeError:
                                pass
                            start = -1
            
            if questions:
                print(f"  Section {sec_idx}: Found {len(questions)} questions from objects")
    
    return questions

key = "SUPERSIX_SECURE_KEY_2025"
input_file = "2023_preproffs/preproff_j.txt"
output_dir = "public/qbanks"

print("=" * 60)
print("EXTRACTING ALL BLOCK J QUESTIONS (Robust Method)")
print("=" * 60)

# Parse all questions
questions = extract_questions_robust(input_file)
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

# Show sample
if kmc_j_questions:
    print(f"\nFirst KMC J question preview:")
    print(f"  {kmc_j_questions[0].get('question', '')[:80]}...")

# Remove duplicates
seen = {}
unique_kmc = []
for q in kmc_j_questions:
    q_text = q.get('question', '')
    q_normalized = ' '.join(q_text.lower().split())[:150]
    
    if q_normalized not in seen:
        seen[q_normalized] = True
        unique_kmc.append(q)

print(f"\nAfter deduplication: {len(unique_kmc)}")

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
if sql_lines:
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
else:
    print("\n❌ No questions found!")
