"""Rebuild GMC M2 from scratch"""
import re
import json

XOR_KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

def normalize_options(options):
    cleaned = []
    for opt in options:
        c = re.sub(r'^[a-e][\.\)]\s*', '', opt.strip(), flags=re.IGNORECASE)
        cleaned.append(c)
    return cleaned

def answer_to_index(answer):
    return {'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4}.get(answer.lower().strip(), 0)

def to_sql(q, college, year):
    text = q['text'].replace("'", "''")
    options = json.dumps(q['options']).replace("'", "''")
    explanation = q.get('explanation', '').replace("'", "''")
    return f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{text}', '{options}', {q['correct']}, '{explanation}', '', '', 'Medium', 'M2', '{college}', '{year}');"

# Extract GMC M2 2023 from preproff_m2.txt
print("1. Extracting GMC M2 2023 from preproff_m2.txt...")
with open('2023_preproffs/preproff_m2.txt', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(
    r'\{\s*'
    r'"id"\s*:\s*"([^"]+)"\s*,\s*'
    r'"block"\s*:\s*"([^"]+)"\s*,\s*'
    r'"year"\s*:\s*"([^"]+)"\s*,\s*'
    r'"question"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*'
    r'"options"\s*:\s*\[((?:[^\]]*?))\]\s*,\s*'
    r'"answer"\s*:\s*"([^"]+)"\s*,?\s*'
    r'(?:"explanation"\s*:\s*"((?:[^"\\]|\\.)*)")?\s*'
    r'\}',
    re.DOTALL
)

questions_2023 = []
for match in pattern.finditer(content):
    college = match.group(1).upper()
    block = match.group(2).upper()
    
    if college != 'GMC' or block != 'M2':
        continue
    
    question = match.group(4).replace('\\"', '"').replace('\\n', '\n')
    options_str = match.group(5)
    answer = match.group(6)
    explanation = match.group(7) if match.group(7) else ""
    explanation = explanation.replace('\\"', '"').replace('\\n', '\n')
    
    try:
        options = json.loads('[' + options_str + ']')
        options = normalize_options(options)
    except:
        continue
    
    questions_2023.append({
        'text': question,
        'options': options,
        'correct': answer_to_index(answer),
        'explanation': explanation
    })

print(f"   Found: {len(questions_2023)} questions")

# Extract GMC M2 2024 from m2gmc2024.txt (text format)
print("\n2. Extracting GMC M2 2024 from m2gmc2024.txt...")
with open('2023_preproffs/2024-25/m2gmc2024.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Parse text format questions
q_pattern = re.compile(r'(\d+)\.\s*(.*?)(?=\n\d+\.|$)', re.DOTALL)
questions_2024 = []

matches = list(q_pattern.finditer(content))
for match in matches:
    q_num = match.group(1)
    q_text = match.group(2).strip()
    
    # Split into question and options
    lines = q_text.split('\n')
    question_lines = []
    options = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if re.match(r'^[a-e][\.\)]\s*', line, re.IGNORECASE):
            opt = re.sub(r'^[a-e][\.\)]\s*', '', line, flags=re.IGNORECASE)
            options.append(opt)
        else:
            question_lines.append(line)
    
    if len(options) >= 4:
        questions_2024.append({
            'text': ' '.join(question_lines),
            'options': options[:5] if len(options) >= 5 else options + [''] * (5 - len(options)),
            'correct': 0,  # Default, no answer info
            'explanation': ''
        })

print(f"   Found: {len(questions_2024)} questions")

# Dedupe
def dedupe(questions):
    seen = set()
    unique = []
    for q in questions:
        key = q['text'][:80].lower().strip()
        if key not in seen:
            seen.add(key)
            unique.append(q)
    return unique

questions_2023 = dedupe(questions_2023)
questions_2024 = dedupe(questions_2024)

print(f"\n3. After dedupe:")
print(f"   2023: {len(questions_2023)}")
print(f"   2024: {len(questions_2024)}")

# Generate SQL
sql_lines = []
for q in questions_2023:
    sql_lines.append(to_sql(q, 'gmc', '2023'))
for q in questions_2024:
    sql_lines.append(to_sql(q, 'gmc', '2024'))

# Write
with open('public/qbanks/gmc M2.enc', 'wb') as f:
    f.write(xor('\n'.join(sql_lines).encode('utf-8'), XOR_KEY))

print(f"\n4. Saved gmc M2.enc with {len(sql_lines)} questions")
print(f"   2023: {len(questions_2023)}, 2024: {len(questions_2024)}")
