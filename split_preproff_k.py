import os
import json
import re

def xor_encrypt_decrypt(data, key):
    """Encrypts or decrypts data using XOR with the given key."""
    key_bytes = key.encode('utf-8')
    key_len = len(key_bytes)
    result = bytearray(len(data))
    
    for i in range(len(data)):
        result[i] = data[i] ^ key_bytes[i % key_len]
        
    return result

def extract_college_from_id(question_id):
    """Extract college name from question ID."""
    id_lower = question_id.lower()
    
    # Check for college prefixes
    if id_lower.startswith('wmc'):
        return 'wmc'
    elif id_lower.startswith('gmc'):
        return 'gmc'
    elif id_lower.startswith('kgmc'):
        return 'kgmc'
    elif id_lower.startswith('nwsm'):
        return 'nwsm'
    elif id_lower.startswith('kmc'):
        return 'kmc'
    else:
        # Default to kmc if no prefix found
        return 'kmc'

def parse_questions_from_file(file_path):
    """Parse questions from the preproff_k.txt file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Try to parse as JSON array
    try:
        # The file should be a JSON array
        questions = json.loads(content)
        return questions
    except json.JSONDecodeError:
        # If not valid JSON, try to extract individual question objects
        print("File is not valid JSON array, trying to extract questions...")
        questions = []
        
        # Pattern to match individual question objects
        pattern = r'\{[^{}]*"id"[^{}]*"block"[^{}]*"year"[^{}]*"question"[^{}]*"options"[^{}]*"answer"[^{}]*"explanation"[^{}]*\}'
        
        # More flexible approach: find all JSON objects
        depth = 0
        start = -1
        for i, char in enumerate(content):
            if char == '{':
                if depth == 0:
                    start = i
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0 and start != -1:
                    try:
                        obj_str = content[start:i+1]
                        obj = json.loads(obj_str)
                        if 'id' in obj and 'question' in obj:
                            questions.append(obj)
                    except:
                        pass
                    start = -1
        
        return questions

def convert_to_sql_format(questions, college, block, year):
    """Convert questions to SQL INSERT format matching the preproff table structure."""
    sql_lines = []
    
    for i, q in enumerate(questions):
        # Extract question data
        question_text = q.get('question', '').replace("'", "''")
        options = q.get('options', [])
        answer = q.get('answer', 'a')
        explanation = q.get('explanation', '').replace("'", "''")
        
        # Convert answer letter to index (a=0, b=1, etc.)
        answer_index = ord(answer.lower()) - ord('a')
        
        # Clean options (remove a., b., etc. prefixes if present)
        cleaned_options = []
        for opt in options:
            # Remove prefix like "a. " or "a) "
            cleaned = re.sub(r'^[a-e][\.\)\:]?\s*', '', opt, flags=re.IGNORECASE)
            cleaned_options.append(cleaned.replace("'", "''"))
        
        # Convert options to JSON string
        options_json = json.dumps(cleaned_options).replace("'", "''")
        
        # Create SQL INSERT statement
        sql = f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{question_text}', '{options_json}', {answer_index}, '{explanation}', '', '', 'Medium', '{block.upper()}', '{college.upper()}', '{year}');"
        sql_lines.append(sql)
    
    return '\n'.join(sql_lines)

def main():
    input_file = 'preproff_k.txt'
    output_dir = os.path.join('public', 'qbanks')
    key = "SUPERSIX_SECURE_KEY_2025"
    
    print(f"Reading {input_file}...")
    
    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} not found!")
        return
    
    # Parse questions
    questions = parse_questions_from_file(input_file)
    print(f"Total questions parsed: {len(questions)}")
    
    # Group questions by college
    college_questions = {
        'wmc': [],
        'gmc': [],
        'kgmc': [],
        'nwsm': [],
        'kmc': []
    }
    
    for q in questions:
        college = extract_college_from_id(q.get('id', ''))
        college_questions[college].append(q)
    
    # Print counts
    print("\nQuestions by college:")
    for college, qs in college_questions.items():
        print(f"  {college.upper()}: {len(qs)} questions")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Process each college
    block = 'K'
    year = '2023'
    
    for college, qs in college_questions.items():
        if len(qs) == 0:
            print(f"\nSkipping {college.upper()} - no questions")
            continue
            
        print(f"\nProcessing {college.upper()}...")
        
        # Convert to SQL format
        sql_content = convert_to_sql_format(qs, college, block, year)
        
        # Encrypt the content
        encrypted_data = xor_encrypt_decrypt(sql_content.encode('utf-8'), key)
        
        # Save encrypted file (format: {college} K.enc)
        output_file = os.path.join(output_dir, f"{college} K.enc")
        with open(output_file, 'wb') as f:
            f.write(encrypted_data)
        
        print(f"  Created: {output_file}")
        print(f"  Questions: {len(qs)}")
        print(f"  Size: {len(encrypted_data)} bytes")
    
    print("\n✅ All encrypted files created successfully!")
    print("\nFiles created:")
    for college in college_questions.keys():
        if len(college_questions[college]) > 0:
            print(f"  - public/qbanks/{college} K.enc")

if __name__ == "__main__":
    main()
