"""
Rebuild kmc M2.enc with correct questions:
- 60 from m2kmc2023.txt (2023)
- 117 from m1kmc2024.txt (2024 - mislabeled as M1)
"""
import json
import re

XOR_KEY = "SUPERSIX_SECURE_KEY_2025"

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

def parse_json_file(filepath, year_override=None, block_override=None):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = []
    for item in data:
        year = year_override or item.get('year', '2023')
        block = block_override or item.get('block', 'M2')
        
        q = {
            'text': item['question'].strip(),
            'options': normalize_options(item['options']),
            'correct': answer_to_index(item['answer']),
            'explanation': item.get('explanation', '').strip(),
            'year': str(year),
            'block': block.upper()
        }
        questions.append(q)
    return questions

def to_sql(q):
    text = q['text'].replace("'", "''")
    options = json.dumps(q['options']).replace("'", "''")
    explanation = q['explanation'].replace("'", "''")
    return f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{text}', '{options}', {q['correct']}, '{explanation}', '', '', 'Medium', '{q['block']}', 'kmc', '{q['year']}');"

def main():
    print("=" * 60)
    print("Rebuilding kmc M2.enc")
    print("=" * 60)
    
    all_questions = []
    
    # 1. Load m2kmc2023.txt (60 KMC M2 2023 questions)
    print("\n1. Loading m2kmc2023.txt...")
    q2023 = parse_json_file('2023_preproffs/m2kmc2023.txt', year_override='2023', block_override='M2')
    print(f"   Loaded {len(q2023)} questions from 2023")
    all_questions.extend(q2023)
    
    # 2. Load m1kmc2024.txt (117 questions - actually M2, not M1)
    print("\n2. Loading m1kmc2024.txt (actually M2 2024)...")
    q2024 = parse_json_file('2023_preproffs/2024-25/m1kmc2024.txt', year_override='2024', block_override='M2')
    print(f"   Loaded {len(q2024)} questions from 2024")
    all_questions.extend(q2024)
    
    print(f"\n   Total before dedup: {len(all_questions)}")
    
    # Deduplicate
    seen = set()
    unique = []
    for q in all_questions:
        key = q['text'][:80].lower().strip()
        if key not in seen:
            seen.add(key)
            unique.append(q)
    
    print(f"   After dedup: {len(unique)}")
    
    # Convert to SQL
    sql_lines = [to_sql(q) for q in unique]
    
    # Count by year
    y2023 = len([q for q in unique if q['year'] == '2023'])
    y2024 = len([q for q in unique if q['year'] == '2024'])
    print(f"\n   Breakdown: 2023={y2023}, 2024={y2024}")
    
    # Write
    content = '\n'.join(sql_lines)
    with open('public/qbanks/kmc M2.enc', 'wb') as f:
        f.write(xor(content.encode('utf-8'), XOR_KEY))
    
    print(f"\n   Saved kmc M2.enc with {len(unique)} questions")
    
    # Also fix kmc M1.enc to remove the 2024 questions
    print("\n" + "=" * 60)
    print("Fixing kmc M1.enc (removing 2024 questions)")
    print("=" * 60)
    
    m1_content = xor(open('public/qbanks/kmc M1.enc', 'rb').read(), XOR_KEY).decode('utf-8')
    m1_lines = [l for l in m1_content.split('\n') if l.strip() and l.startswith('INSERT')]
    print(f"   Current: {len(m1_lines)} questions")
    
    # Keep only 2023 questions
    m1_2023 = [l for l in m1_lines if "'2023'" in l]
    m1_other = [l for l in m1_lines if "'2023'" not in l]
    print(f"   2023: {len(m1_2023)}, Other: {len(m1_other)}")
    
    with open('public/qbanks/kmc M1.enc', 'wb') as f:
        f.write(xor('\n'.join(m1_2023).encode('utf-8'), XOR_KEY))
    print(f"   Saved kmc M1.enc with {len(m1_2023)} questions (2023 only)")

if __name__ == "__main__":
    main()
