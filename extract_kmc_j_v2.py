"""
Extract ALL KMC Block J questions from preproff_j.txt using line-by-line parsing.
This handles the malformed JSON structure by looking for complete question blocks.
"""
import re
import json

def extract_kmc_questions():
    with open("2023_preproffs/preproff_j.txt", "r", encoding="utf-8") as f:
        content = f.read()
    
    # The file contains multiple JSON arrays concatenated together
    # We need to find individual question objects
    
    questions = []
    
    # Use regex to extract complete question objects
    # Pattern matches objects with "id": "KMC" (case insensitive)
    
    # First, let's normalize the content - remove code block markers
    content = re.sub(r'```json\s*\[', '[', content)
    content = re.sub(r'```', '', content)
    
    # Find all question objects using regex that matches the structure
    pattern = re.compile(
        r'\{\s*'
        r'"id"\s*:\s*"([^"]+)"\s*,\s*'
        r'"block"\s*:\s*"([^"]+)"\s*,\s*'
        r'"year"\s*:\s*"([^"]+)"\s*,\s*'
        r'"question"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*'
        r'"options"\s*:\s*\[((?:[^\]\\]|\\.)*)\]\s*,\s*'
        r'"answer"\s*:\s*"([^"]+)"\s*,?\s*'
        r'(?:"explanation"\s*:\s*"((?:[^"\\]|\\.)*)")?\s*'
        r'\}',
        re.DOTALL
    )
    
    for match in pattern.finditer(content):
        college_id = match.group(1)
        block = match.group(2)
        year = match.group(3)
        question = match.group(4)
        options_str = match.group(5)
        answer = match.group(6)
        explanation = match.group(7) if match.group(7) else ""
        
        # Only process KMC questions
        if college_id.upper() != "KMC":
            continue
            
        # Parse options
        try:
            # Clean up options string
            options_str = '[' + options_str + ']'
            options = json.loads(options_str)
            # Remove letter prefixes
            cleaned_options = []
            for opt in options:
                cleaned = re.sub(r'^[a-e]\.\s*', '', opt, flags=re.IGNORECASE)
                cleaned_options.append(cleaned)
        except:
            continue
        
        # Convert answer letter to index
        letter_map = {'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4}
        correct_idx = letter_map.get(answer.lower().strip(), 0)
        
        # Unescape the question and explanation
        question = question.replace('\\"', '"').replace('\\n', '\n')
        explanation = explanation.replace('\\"', '"').replace('\\n', '\n') if explanation else ""
        
        questions.append({
            'text': question,
            'options': cleaned_options,
            'correct': correct_idx,
            'explanation': explanation,
            'year': year
        })
    
    print(f"Extracted {len(questions)} KMC Block J questions")
    
    # Remove duplicates
    seen = set()
    unique = []
    for q in questions:
        key = q['text'].strip().lower()[:100]
        if key not in seen:
            seen.add(key)
            unique.append(q)
    
    print(f"After dedup: {len(unique)} unique questions")
    
    return unique

def main():
    questions = extract_kmc_questions()
    
    if not questions:
        print("No questions found!")
        return
    
    # Convert to SQL
    sql_statements = []
    for q in questions:
        text = q['text'].replace("'", "''")
        options_json = json.dumps(q['options']).replace("'", "''")
        correct = q['correct']
        explanation = q.get('explanation', '').replace("'", "''")
        
        sql = f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{text}', '{options_json}', {correct}, '{explanation}', 'General', 'General', 'medium', 'J', 'kmc', 2023);"
        sql_statements.append(sql)
    
    # XOR encrypt and save
    XOR_KEY = "SUPERSIX_SECURE_KEY_2025"
    
    def xor_crypt(data: bytes, key: str) -> bytes:
        key_bytes = key.encode('utf-8')
        return bytes([b ^ key_bytes[i % len(key_bytes)] for i, b in enumerate(data)])
    
    # Only use freshly extracted questions (no need to merge with old corrupt data)
    all_sql = sql_statements
    
    print(f"Total: {len(all_sql)} questions")
    
    # Write
    combined = '\n'.join(all_sql)
    encrypted = xor_crypt(combined.encode('utf-8'), XOR_KEY)
    with open("public/qbanks/kmc J.enc", "wb") as f:
        f.write(encrypted)
    
    print(f"Wrote kmc J.enc with {len(all_sql)} questions")

if __name__ == "__main__":
    main()
