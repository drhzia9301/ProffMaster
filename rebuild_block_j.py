"""
Re-extract ALL Block J 2023 questions from preproff_j.txt
Treats "XXXX" year as "2023"
"""
import re
import json
import os

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

def extract_questions(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match question objects
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
    
    questions = {
        'GMC': [], 'WMC': [], 'KMC': [], 'KGMC': [], 'NWSM': []
    }
    
    for match in pattern.finditer(content):
        college = match.group(1).upper()
        block = match.group(2).upper()
        year = match.group(3)
        question = match.group(4)
        options_str = match.group(5)
        answer = match.group(6)
        explanation = match.group(7) if match.group(7) else ""
        
        # Skip non-J blocks or unknown colleges
        if block != 'J' or college not in questions:
            continue
        
        # Treat XXXX as 2023
        if year == 'XXXX':
            year = '2023'
        
        # Parse options
        try:
            options_str = '[' + options_str + ']'
            options = json.loads(options_str)
            options = normalize_options(options)
        except:
            continue
        
        # Unescape
        question = question.replace('\\"', '"').replace('\\n', '\n').replace("\\'", "'")
        explanation = explanation.replace('\\"', '"').replace('\\n', '\n').replace("\\'", "'") if explanation else ""
        
        # Fix known typos
        question = question.replace("bernatir entenhalitit", "herpetic encephalitis")
        question = question.replace("microscopl", "microscopic")
        
        questions[college].append({
            'text': question,
            'options': options,
            'correct': answer_to_index(answer),
            'explanation': explanation,
            'year': year
        })
    
    return questions

def to_sql(q, college, block='J'):
    text = q['text'].replace("'", "''")
    options = json.dumps(q['options']).replace("'", "''")
    explanation = q['explanation'].replace("'", "''")
    year = q['year']
    return f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{text}', '{options}', {q['correct']}, '{explanation}', '', '', 'Medium', '{block}', '{college.lower()}', '{year}');"

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
    print("Re-extracting ALL Block J 2023 questions")
    print("=" * 60)
    
    questions = extract_questions('2023_preproffs/preproff_j.txt')
    
    for college, qs in questions.items():
        print(f"\n{college}: {len(qs)} raw questions")
        
        # Check year distribution
        years = {}
        for q in qs:
            y = q['year']
            years[y] = years.get(y, 0) + 1
        print(f"  Years: {years}")
    
    print("\n" + "=" * 60)
    print("Rebuilding .enc files for Block J")
    print("=" * 60)
    
    for college in ['GMC', 'WMC', 'KMC', 'KGMC', 'NWSM']:
        enc_file = f'public/qbanks/{college.lower()} J.enc'
        
        # Get 2023 questions from source
        qs_2023 = [q for q in questions[college] if q['year'] == '2023']
        qs_2023 = dedupe(qs_2023)
        print(f"\n{college} J: {len(qs_2023)} unique 2023 questions")
        
        # Read existing file to get non-2023 questions (2024, 2025)
        existing_non_2023 = []
        if os.path.exists(enc_file):
            content = xor(open(enc_file, 'rb').read(), XOR_KEY).decode('utf-8')
            lines = [l for l in content.split('\n') if l.strip() and l.startswith('INSERT')]
            # Keep only 2024 and 2025
            for l in lines:
                if "'2024'" in l or "'2025'" in l:
                    existing_non_2023.append(l)
            print(f"  Keeping {len(existing_non_2023)} existing 2024/2025 questions")
        
        # Convert 2023 to SQL
        sql_2023 = [to_sql(q, college) for q in qs_2023]
        
        # Combine
        all_sql = sql_2023 + existing_non_2023
        
        # Final dedupe
        seen = set()
        final = []
        for l in all_sql:
            match = re.search(r"VALUES \('(.{1,80})", l)
            if match:
                key = match.group(1).lower().strip()
                if key not in seen:
                    seen.add(key)
                    final.append(l)
        
        print(f"  Final: {len(final)} total questions")
        
        # Count by year
        y2023 = len([l for l in final if "'2023'" in l])
        y2024 = len([l for l in final if "'2024'" in l])
        y2025 = len([l for l in final if "'2025'" in l])
        print(f"  Breakdown: 2023={y2023}, 2024={y2024}, 2025={y2025}")
        
        # Write
        with open(enc_file, 'wb') as f:
            f.write(xor('\n'.join(final).encode('utf-8'), XOR_KEY))

if __name__ == "__main__":
    main()
