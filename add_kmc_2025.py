"""Add KMC 2025 questions to existing KMC files"""
import json
import re

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

def to_sql(q, college, block, year):
    text = q['text'].replace("'", "''")
    options = json.dumps(q['options']).replace("'", "''")
    explanation = q.get('explanation', '').replace("'", "''")
    return f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{text}', '{options}', {q['correct']}, '{explanation}', '', '', 'Medium', '{block}', '{college}', '{year}');"

def dedupe(lines):
    seen = set()
    unique = []
    for l in lines:
        start = l.find("VALUES ('") + 9
        end = l.find("',", start)
        if start > 8 and end > start:
            key = l[start:end][:80].lower().strip()
            if key not in seen:
                seen.add(key)
                unique.append(l)
        else:
            unique.append(l)
    return unique

blocks = ['J', 'L', 'M1']

for block in blocks:
    print(f"\n{'='*60}")
    print(f"Processing KMC {block}")
    print('='*60)
    
    # Read the 2025 JSON file
    with open(f'kmc2025/kmc {block}.enc', 'rb') as f:
        data_2025 = xor(f.read(), XOR_KEY).decode('utf-8')
    
    try:
        questions_2025_raw = json.loads(data_2025)
        print(f"Loaded {len(questions_2025_raw)} questions from 2025 file")
    except json.JSONDecodeError as e:
        print(f"JSON error: {e}")
        continue
    
    # Convert to SQL format
    sql_2025 = []
    for item in questions_2025_raw:
        q = {
            'text': item['question'].strip(),
            'options': normalize_options(item['options']),
            'correct': answer_to_index(item['answer']),
            'explanation': item.get('explanation', '').strip()
        }
        sql_2025.append(to_sql(q, 'kmc', block, '2025'))
    
    print(f"Converted to {len(sql_2025)} SQL statements")
    
    # Read existing file
    with open(f'public/qbanks/kmc {block}.enc', 'rb') as f:
        data_existing = xor(f.read(), XOR_KEY).decode('utf-8')
    
    lines_existing = [l for l in data_existing.strip().split('\n') if l.strip() and l.startswith('INSERT')]
    print(f"Existing file has {len(lines_existing)} questions")
    
    # Combine
    all_lines = lines_existing + sql_2025
    
    # Dedupe
    all_lines = dedupe(all_lines)
    print(f"After dedupe: {len(all_lines)} questions")
    
    # Count by year
    years = {}
    for l in all_lines:
        if "'2023'" in l:
            years['2023'] = years.get('2023', 0) + 1
        elif "'2024'" in l:
            years['2024'] = years.get('2024', 0) + 1
        elif "'2025'" in l:
            years['2025'] = years.get('2025', 0) + 1
    print(f"Years: {years}")
    
    # Write back
    with open(f'public/qbanks/kmc {block}.enc', 'wb') as f:
        f.write(xor('\n'.join(all_lines).encode('utf-8'), XOR_KEY))
    
    print(f"Saved kmc {block}.enc with {len(all_lines)} questions")

print("\n" + "="*60)
print("DONE!")
print("="*60)
