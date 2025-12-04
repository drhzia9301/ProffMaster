"""
Properly rebuild kmc J.enc:
- 2023 questions from preproff_j.txt (only year="2023")
- 2024 questions from jkmc2024.txt ONLY
"""
import re
import json

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

def extract_kmc_2023_from_preproff():
    """Extract only KMC 2023 questions from preproff_j.txt"""
    with open('2023_preproffs/preproff_j.txt', 'r', encoding='utf-8') as f:
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
    
    questions = []
    for match in pattern.finditer(content):
        college = match.group(1).upper()
        block = match.group(2).upper()
        year = match.group(3)
        
        # Only KMC, Block J, Year 2023
        if college != 'KMC' or block != 'J':
            continue
        if year != '2023':  # Skip 2024 and XXXX (KMC has no XXXX)
            continue
        
        question = match.group(4)
        options_str = match.group(5)
        answer = match.group(6)
        explanation = match.group(7) if match.group(7) else ""
        
        try:
            options = json.loads('[' + options_str + ']')
            options = normalize_options(options)
        except:
            continue
        
        question = question.replace('\\"', '"').replace('\\n', '\n')
        explanation = explanation.replace('\\"', '"').replace('\\n', '\n') if explanation else ""
        
        # Fix known typos
        question = question.replace("bernatir entenhalitit", "herpetic encephalitis")
        question = question.replace("microscopl", "microscopic")
        
        questions.append({
            'text': question,
            'options': options,
            'correct': answer_to_index(answer),
            'explanation': explanation,
            'year': '2023'
        })
    
    return questions

def extract_kmc_2024_from_file():
    """Extract KMC 2024 questions from jkmc2024.txt"""
    with open('2023_preproffs/2024-25/jkmc2024.txt', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = []
    for item in data:
        questions.append({
            'text': item['question'].strip(),
            'options': normalize_options(item['options']),
            'correct': answer_to_index(item['answer']),
            'explanation': item.get('explanation', '').strip(),
            'year': '2024'
        })
    
    return questions

def to_sql(q):
    text = q['text'].replace("'", "''")
    options = json.dumps(q['options']).replace("'", "''")
    explanation = q['explanation'].replace("'", "''")
    year = q['year']
    return f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{text}', '{options}', {q['correct']}, '{explanation}', '', '', 'Medium', 'J', 'kmc', '{year}');"

def dedupe(questions):
    seen = set()
    unique = []
    for q in questions:
        key = q['text'][:80].lower().strip()
        if key not in seen:
            seen.add(key)
            unique.append(q)
    return unique

def main():
    print("=" * 60)
    print("Rebuilding kmc J.enc properly")
    print("=" * 60)
    
    # Get 2023 from preproff_j.txt
    print("\n1. Extracting KMC 2023 from preproff_j.txt...")
    q2023 = extract_kmc_2023_from_preproff()
    print(f"   Found {len(q2023)} raw 2023 questions")
    q2023 = dedupe(q2023)
    print(f"   After dedup: {len(q2023)} unique 2023 questions")
    
    # Get 2024 from jkmc2024.txt
    print("\n2. Extracting KMC 2024 from jkmc2024.txt...")
    q2024 = extract_kmc_2024_from_file()
    print(f"   Found {len(q2024)} raw 2024 questions")
    q2024 = dedupe(q2024)
    print(f"   After dedup: {len(q2024)} unique 2024 questions")
    
    # Combine
    all_questions = q2023 + q2024
    print(f"\n3. Combined: {len(all_questions)} questions")
    
    # Final dedup (in case 2023 and 2024 have overlaps)
    all_questions = dedupe(all_questions)
    print(f"   After final dedup: {len(all_questions)} questions")
    
    # Count by year
    y2023 = len([q for q in all_questions if q['year'] == '2023'])
    y2024 = len([q for q in all_questions if q['year'] == '2024'])
    print(f"\n   Final breakdown: 2023={y2023}, 2024={y2024}")
    
    # Convert to SQL
    sql_lines = [to_sql(q) for q in all_questions]
    
    # Write
    content = '\n'.join(sql_lines)
    with open('public/qbanks/kmc J.enc', 'wb') as f:
        f.write(xor(content.encode('utf-8'), XOR_KEY))
    
    print(f"\n   Saved kmc J.enc with {len(sql_lines)} questions")

if __name__ == "__main__":
    main()
