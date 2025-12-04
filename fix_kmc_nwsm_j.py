"""
Fix multiple issues:
1. Fix herpes question explanation (remove reference to typo)
2. Move 7 questions from KMC to NWSM for Block J 2023
3. Add MEDICINE questions (6) to NWSM
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

def to_sql(q, college):
    text = q['text'].replace("'", "''")
    options = json.dumps(q['options']).replace("'", "''")
    explanation = q['explanation'].replace("'", "''")
    year = q['year']
    return f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{text}', '{options}', {q['correct']}, '{explanation}', '', '', 'Medium', 'J', '{college}', '{year}');"

def extract_questions_by_college(filepath, target_colleges):
    """Extract questions for specified colleges from preproff_j.txt"""
    with open(filepath, 'r', encoding='utf-8') as f:
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
    
    questions = {c: [] for c in target_colleges}
    
    for match in pattern.finditer(content):
        college = match.group(1).upper()
        block = match.group(2).upper()
        year = match.group(3)
        
        if block != 'J':
            continue
        
        # Map MEDICINE to NWSM
        if college == 'MEDICINE':
            college = 'NWSM'
        
        if college not in target_colleges:
            continue
            
        # Treat XXXX as 2023
        if year == 'XXXX':
            year = '2023'
        
        # Only 2023 for this extraction
        if year != '2023':
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
        
        # Fix herpes question
        question = question.replace("bernatir entenhalitit", "herpetic encephalitis")
        question = question.replace("microscopl", "microscopic")
        
        # Fix explanation - remove reference to typo
        if "bernatir entenhalitit" in explanation or "typographical error" in explanation.lower():
            explanation = "Herpes Simplex Virus (HSV) encephalitis is characterized by Cowdry type A intranuclear inclusions (also called Cowdry bodies). These are eosinophilic inclusions found in neurons and glial cells, and are pathognomonic for herpesvirus infections."
        
        questions[college].append({
            'text': question,
            'options': options,
            'correct': answer_to_index(answer),
            'explanation': explanation,
            'year': '2023'
        })
    
    return questions

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
    print("Fixing KMC and NWSM Block J files")
    print("=" * 60)
    
    # Extract from preproff_j.txt
    print("\n1. Extracting from preproff_j.txt...")
    questions = extract_questions_by_college('2023_preproffs/preproff_j.txt', ['KMC', 'NWSM'])
    
    print(f"   KMC raw: {len(questions['KMC'])}")
    print(f"   NWSM raw: {len(questions['NWSM'])}")
    
    # Dedupe
    questions['KMC'] = dedupe(questions['KMC'])
    questions['NWSM'] = dedupe(questions['NWSM'])
    
    print(f"   KMC after dedup: {len(questions['KMC'])}")
    print(f"   NWSM after dedup: {len(questions['NWSM'])}")
    
    # Move 7 questions from KMC to NWSM
    print("\n2. Moving 7 questions from KMC to NWSM...")
    questions_to_move = questions['KMC'][-7:]
    questions['KMC'] = questions['KMC'][:-7]
    questions['NWSM'].extend(questions_to_move)
    
    print(f"   KMC after move: {len(questions['KMC'])}")
    print(f"   NWSM after move: {len(questions['NWSM'])}")
    
    # Dedupe NWSM again
    questions['NWSM'] = dedupe(questions['NWSM'])
    print(f"   NWSM after final dedup: {len(questions['NWSM'])}")
    
    # Get 2024 KMC from jkmc2024.txt
    print("\n3. Loading KMC 2024 from jkmc2024.txt...")
    with open('2023_preproffs/2024-25/jkmc2024.txt', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    kmc_2024 = []
    for item in data:
        kmc_2024.append({
            'text': item['question'].strip(),
            'options': normalize_options(item['options']),
            'correct': answer_to_index(item['answer']),
            'explanation': item.get('explanation', '').strip(),
            'year': '2024'
        })
    
    kmc_2024 = dedupe(kmc_2024)
    print(f"   KMC 2024: {len(kmc_2024)} questions")
    
    # Combine KMC
    all_kmc = questions['KMC'] + kmc_2024
    all_kmc = dedupe(all_kmc)
    
    # Count by year
    kmc_2023 = len([q for q in all_kmc if q['year'] == '2023'])
    kmc_2024_count = len([q for q in all_kmc if q['year'] == '2024'])
    print(f"\n4. Final KMC: 2023={kmc_2023}, 2024={kmc_2024_count}, Total={len(all_kmc)}")
    
    nwsm_2023 = len([q for q in questions['NWSM'] if q['year'] == '2023'])
    print(f"   Final NWSM: 2023={nwsm_2023}")
    
    # Write KMC J.enc
    print("\n5. Writing kmc J.enc...")
    sql_kmc = [to_sql(q, 'kmc') for q in all_kmc]
    with open('public/qbanks/kmc J.enc', 'wb') as f:
        f.write(xor('\n'.join(sql_kmc).encode('utf-8'), XOR_KEY))
    print(f"   Saved kmc J.enc with {len(sql_kmc)} questions")
    
    # Write NWSM J.enc
    print("\n6. Writing nwsm J.enc...")
    sql_nwsm = [to_sql(q, 'nwsm') for q in questions['NWSM']]
    with open('public/qbanks/nwsm J.enc', 'wb') as f:
        f.write(xor('\n'.join(sql_nwsm).encode('utf-8'), XOR_KEY))
    print(f"   Saved nwsm J.enc with {len(sql_nwsm)} questions")

if __name__ == "__main__":
    main()
