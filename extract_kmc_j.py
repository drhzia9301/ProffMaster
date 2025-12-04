"""
Extract ALL KMC Block J questions from the malformed preproff_j.txt file.
Uses regex to find individual question objects regardless of JSON structure.
"""
import re
import json

def extract_all_kmc_questions():
    with open("2023_preproffs/preproff_j.txt", "r", encoding="utf-8") as f:
        content = f.read()
    
    questions = []
    parse_errors = []
    
    # Find all positions of "id": "KMC"
    kmc_pattern = re.compile(r'"id"\s*:\s*"[Kk][Mm][Cc]"', re.IGNORECASE)
    
    for match in kmc_pattern.finditer(content):
        pos = match.start()
        
        # Find the opening brace before this position
        brace_count = 0
        start_pos = pos
        for i in range(pos, -1, -1):
            if content[i] == '}':
                brace_count += 1
            elif content[i] == '{':
                if brace_count == 0:
                    start_pos = i
                    break
                brace_count -= 1
        
        # Find the closing brace after this position
        brace_count = 1
        end_pos = len(content)
        for i in range(start_pos + 1, len(content)):
            if content[i] == '{':
                brace_count += 1
            elif content[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_pos = i + 1
                    break
        
        obj_str = content[start_pos:end_pos]
        
        try:
            obj = json.loads(obj_str)
            # Check for either format: 'text'/'question' and 'correct'/'correctAnswer'
            question_text = obj.get('text') or obj.get('question')
            correct = obj.get('correct', obj.get('correctAnswer'))
            if question_text and 'options' in obj and correct is not None:
                # Normalize to standard format
                normalized = {
                    'text': question_text,
                    'options': obj['options'],
                    'correct': correct,
                    'explanation': obj.get('explanation', ''),
                    'subject': obj.get('subject', 'General'),
                    'topic': obj.get('topic', 'General'),
                    'difficulty': obj.get('difficulty', 'medium')
                }
                questions.append(normalized)
        except json.JSONDecodeError as e:
            parse_errors.append((pos, str(e), obj_str[:100]))
    
    print(f"Found {len(questions)} KMC questions")
    print(f"Parse errors: {len(parse_errors)}")
    
    if parse_errors:
        print("\nSample parse errors:")
        for i, (pos, err, preview) in enumerate(parse_errors[:5]):
            print(f"  {i+1}. Position {pos}: {err}")
            print(f"     Preview: {preview}...")
    
    # Remove duplicates based on question text
    seen_texts = set()
    unique_questions = []
    for q in questions:
        text_key = q['text'].strip().lower()[:100]
        if text_key not in seen_texts:
            seen_texts.add(text_key)
            unique_questions.append(q)
    
    print(f"\nAfter deduplication: {len(unique_questions)} unique questions")
    
    # Convert to SQL format
    sql_statements = []
    for q in unique_questions:
        text = q['text'].replace("'", "''")
        
        # Normalize options - remove "a. ", "b. " prefixes if present
        options = q['options']
        cleaned_options = []
        for opt in options:
            if isinstance(opt, str):
                # Remove letter prefixes like "a. ", "b. ", etc.
                cleaned = re.sub(r'^[a-e]\.\s*', '', opt, flags=re.IGNORECASE)
                cleaned_options.append(cleaned)
            else:
                cleaned_options.append(opt)
        
        options_json = json.dumps(cleaned_options).replace("'", "''")
        
        # Handle correct answer - could be index or letter
        correct = q['correct']
        if isinstance(correct, str):
            # Convert letter to index
            letter_map = {'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4}
            correct = letter_map.get(correct.lower().strip(), 0)
        
        explanation = q.get('explanation', '').replace("'", "''")
        subject = q.get('subject', 'General').replace("'", "''")
        topic = q.get('topic', 'General').replace("'", "''")
        difficulty = q.get('difficulty', 'medium').replace("'", "''")
        
        sql = f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{text}', '{options_json}', {correct}, '{explanation}', '{subject}', '{topic}', '{difficulty}', 'J', 'kmc', 2023);"
        sql_statements.append(sql)
    
    print(f"Generated {len(sql_statements)} SQL statements")
    
    # Read existing kmc J.enc
    XOR_KEY = "SUPERSIX_SECURE_KEY_2025"
    
    def xor_crypt(data: bytes, key: str) -> bytes:
        key_bytes = key.encode('utf-8')
        return bytes([b ^ key_bytes[i % len(key_bytes)] for i, b in enumerate(data)])
    
    existing_questions = []
    try:
        with open("public/qbanks/kmc J.enc", "rb") as f:
            encrypted = f.read()
            decrypted = xor_crypt(encrypted, XOR_KEY).decode('utf-8')
            existing_questions = [q.strip() for q in decrypted.split('\n') if q.strip()]
            print(f"\nExisting kmc J.enc has {len(existing_questions)} questions")
    except Exception as e:
        print(f"Could not read existing file: {e}")
    
    # Check what years we have in existing
    year_2024 = [q for q in existing_questions if ", 2024);" in q]
    year_2025 = [q for q in existing_questions if ", 2025);" in q]
    year_2023 = [q for q in existing_questions if ", 2023);" in q]
    print(f"Existing breakdown: 2023={len(year_2023)}, 2024={len(year_2024)}, 2025={len(year_2025)}")
    
    # Replace 2023 questions, keep non-2023
    non_2023 = [q for q in existing_questions if ", 2023);" not in q]
    print(f"Keeping {len(non_2023)} non-2023 questions from existing file")
    
    # Merge: new 2023 questions + existing non-2023 questions
    all_sql = sql_statements + non_2023
    
    # Final dedup
    seen = set()
    final_questions = []
    for q in all_sql:
        # Extract text for comparison
        match = re.search(r"VALUES \('(.{1,100})", q)
        if match:
            text_key = match.group(1).strip().lower()
            if text_key not in seen:
                seen.add(text_key)
                final_questions.append(q)
        else:
            final_questions.append(q)
    
    print(f"\nFinal count after merge and dedup: {len(final_questions)} questions")
    
    # Count by year
    final_2023 = len([q for q in final_questions if ", 2023);" in q])
    final_2024 = len([q for q in final_questions if ", 2024);" in q])
    final_2025 = len([q for q in final_questions if ", 2025);" in q])
    print(f"Final breakdown: 2023={final_2023}, 2024={final_2024}, 2025={final_2025}")
    
    # Write encrypted file
    combined = '\n'.join(final_questions)
    encrypted = xor_crypt(combined.encode('utf-8'), XOR_KEY)
    with open("public/qbanks/kmc J.enc", "wb") as f:
        f.write(encrypted)
    
    print(f"\nSuccessfully wrote kmc J.enc with {len(final_questions)} total questions")

if __name__ == "__main__":
    extract_all_kmc_questions()
