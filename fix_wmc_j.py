"""
Properly rebuild wmc J.enc:
- 2023 questions from preproff_j.txt (year="2023" or "XXXX")
- 2025 questions from jwmc2025.txt ONLY
- NO 2024 (there's no source file for WMC J 2024)
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

def extract_wmc_2023_from_preproff():
    """Extract WMC 2023 questions from preproff_j.txt (including XXXX)"""
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
        
        # Only WMC, Block J, Year 2023 or XXXX
        if college != 'WMC' or block != 'J':
            continue
        if year not in ['2023', 'XXXX']:
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
        
        questions.append({
            'text': question,
            'options': options,
            'correct': answer_to_index(answer),
            'explanation': explanation,
            'year': '2023'  # Treat XXXX as 2023
        })
    
    return questions

def extract_wmc_2025_from_file():
    """Extract WMC 2025 questions from jwmc2025.txt"""
    with open('2023_preproffs/2024-25/jwmc2025.txt', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = []
    for item in data:
        questions.append({
            'text': item['question'].strip(),
            'options': normalize_options(item['options']),
            'correct': answer_to_index(item['answer']),
            'explanation': item.get('explanation', '').strip(),
            'year': '2025'
        })
    
    return questions

def to_sql(q):
    text = q['text'].replace("'", "''")
    options = json.dumps(q['options']).replace("'", "''")
    explanation = q['explanation'].replace("'", "''")
    year = q['year']
    return f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{text}', '{options}', {q['correct']}, '{explanation}', '', '', 'Medium', 'J', 'wmc', '{year}');"

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
    print("Rebuilding wmc J.enc properly")
    print("=" * 60)
    
    # Get 2023 from preproff_j.txt
    print("\n1. Extracting WMC 2023 from preproff_j.txt...")
    q2023 = extract_wmc_2023_from_preproff()
    print(f"   Found {len(q2023)} raw 2023 questions")
    q2023 = dedupe(q2023)
    print(f"   After dedup: {len(q2023)} unique 2023 questions")
    
    # Get 2025 from jwmc2025.txt
    print("\n2. Extracting WMC 2025 from jwmc2025.txt...")
    q2025 = extract_wmc_2025_from_file()
    print(f"   Found {len(q2025)} raw 2025 questions")
    q2025 = dedupe(q2025)
    print(f"   After dedup: {len(q2025)} unique 2025 questions")
    
    # Combine
    all_questions = q2023 + q2025
    print(f"\n3. Combined: {len(all_questions)} questions")
    
    # Final dedup
    all_questions = dedupe(all_questions)
    print(f"   After final dedup: {len(all_questions)} questions")
    
    # Count by year
    y2023 = len([q for q in all_questions if q['year'] == '2023'])
    y2025 = len([q for q in all_questions if q['year'] == '2025'])
    print(f"\n   Final breakdown: 2023={y2023}, 2025={y2025}")
    
    # Convert to SQL
    sql_lines = [to_sql(q) for q in all_questions]
    
    # Write
    content = '\n'.join(sql_lines)
    with open('public/qbanks/wmc J.enc', 'wb') as f:
        f.write(xor(content.encode('utf-8'), XOR_KEY))
    
    print(f"\n   Saved wmc J.enc with {len(sql_lines)} questions")

if __name__ == "__main__":
    main()
