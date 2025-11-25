import json
import os
from pathlib import Path

# Subject mapping
SUBJECT_MAP = {
    'ENT.txt': 'ENT',
    'Forensic.txt': 'Forensic Medicine',
    'community.txt': 'Community Medicine',
    'gynae.txt': 'Obstetrics & Gynecology',
    'med.txt': 'Medicine',
    'ophth.txt': 'Ophthalmology',
    'patho.txt': 'Pathology',
    'pharma.txt': 'Pharmacology',
    'psych.txt': 'Psychiatry',
    'surgery.txt': 'Surgery'
}

def escape_sql(text):
    if text is None:
        return "NULL"
    # Replace semicolons to prevent splitting issues in the app/importer
    # The app splits SQL statements by ';', so semicolons in text break the import
    clean_text = str(text).replace(";", ",")
    return "'" + clean_text.replace("'", "''") + "'"

def parse_question_file(file_path, subject):
    """Parse a question bank text file and return list of questions"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read().strip()
    
    questions_raw = []
    
    # Robust JSON Object Extractor
    # This handles files that have garbage text between JSON objects (like "code", "JSON", "download")
    # It finds the start of an object '{' and tracks braces to find the matching '}'
    
    idx = 0
    length = len(content)
    
    while idx < length:
        # Find the start of the next object
        start_idx = content.find('{', idx)
        if start_idx == -1:
            break
            
        # Track brace balance to find the end of this object
        balance = 0
        in_string = False
        escape = False
        end_idx = -1
        
        for i in range(start_idx, length):
            char = content[i]
            
            if escape:
                escape = False
                continue
                
            if char == '\\':
                escape = True
                continue
                
            if char == '"':
                in_string = not in_string
                continue
                
            if not in_string:
                if char == '{':
                    balance += 1
                elif char == '}':
                    balance -= 1
                    if balance == 0:
                        end_idx = i + 1
                        break
        
        if end_idx != -1:
            # Found a potential JSON object
            json_str = content[start_idx:end_idx]
            try:
                # Try to clean up common trailing comma issues before parsing
                # Remove trailing commas before closing braces/brackets
                import re
                json_str = re.sub(r',\s*}', '}', json_str)
                json_str = re.sub(r',\s*]', ']', json_str)
                
                q = json.loads(json_str)
                questions_raw.append(q)
            except json.JSONDecodeError as e:
                # Attempt to repair unescaped quotes
                # This is a heuristic: if we find " inside a string value, escape it
                try:
                    # Simple heuristic: replace " with ' if it looks like it's inside a text field
                    # We assume keys are safe. We only care about values.
                    # This is risky but works for "tea colored urine" cases
                    
                    # Regex to find "question": "..." and "explanation": "..." blocks
                    # and escape quotes inside them
                    def escape_inner_quotes(match):
                        prefix = match.group(1) # "key": "
                        content = match.group(2) # content
                        suffix = match.group(3) # "
                        # Escape " to ' inside content
                        content_fixed = content.replace('"', "'")
                        return f'{prefix}{content_fixed}{suffix}'

                    # Pattern matches "key": "content"
                    # We use non-greedy match for content, but it might stop at the first quote
                    # So we need to be careful.
                    # Instead, let's just replace " with ' if it's surrounded by letters/spaces
                    
                    repaired_str = json_str
                    # Look for "word " word" -> "word ' word"
                    repaired_str = re.sub(r'([a-zA-Z])\s*"\s*([a-zA-Z])', r"\1 '\2", repaired_str)
                    # Look for "word" word" -> "word' word"
                    repaired_str = re.sub(r'([a-zA-Z])"\s*([a-zA-Z])', r"\1' \2", repaired_str)
                    
                    q = json.loads(repaired_str)
                    questions_raw.append(q)
                    print(f"  - Repaired malformed object in {file_path}")
                except:
                    print(f"Skipping malformed object in {file_path}: {e}")
                    # print(f"Failed string snippet: {json_str[:50]}...")
            
            idx = end_idx
        else:
            # Could not find matching brace, skip this start brace
            idx = start_idx + 1

    print(f"  - Extracted {len(questions_raw)} valid objects from {file_path}")

    questions = []
    for q in questions_raw:
        correct_answer = q.get('answer', '')
        options = q.get('options', [])
        correct_index = -1
        
        # Normalize options if they are strings (some files might have them as strings)
        if isinstance(options, str):
            try:
                options = json.loads(options)
            except:
                options = []

        for i, opt in enumerate(options):
            if opt == correct_answer:
                correct_index = i
                break
        
        # Generate a deterministic ID if missing
        q_id = q.get('id', 0)
        # Use the subject from the question itself, fall back to the file-based subject
        question_subject = q.get('subject', subject)
        generated_id = f"{question_subject.lower().replace(' ', '_').replace('&', 'and')}_{q_id}"
        
        question_obj = {
            'id': generated_id,
            'subject': question_subject,  # Use the subject from JSON
            'topic': q.get('topic', 'General'),
            'question': q.get('question', ''),
            'options': json.dumps(options),
            'correct_answer': correct_answer,
            'correct_index': correct_index,
            'explanation': q.get('explanation', ''),
            'difficulty': 'Medium'
        }
        questions.append(question_obj)
    
    return questions

def generate_sql_file():
    qbanks_dir = Path('qbanks')
    output_file = Path('public/assets/initial_db.sql')
    
    # Ensure output directory exists
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        # Create table schema
        f.write("""
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    topic TEXT,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    correct_index INTEGER,
    explanation TEXT,
    difficulty TEXT DEFAULT 'Medium',
    is_bookmarked INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_topic ON questions(topic);

CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id TEXT,
    selected_option_index INTEGER,
    is_correct INTEGER,
    timestamp INTEGER,
    time_spent_seconds INTEGER,
    FOREIGN KEY(question_id) REFERENCES questions(id)
);
""")
        
        # Insert data
        f.write("\nBEGIN TRANSACTION;\n")
        
        count = 0
        for filename, subject in SUBJECT_MAP.items():
            file_path = qbanks_dir / filename
            if file_path.exists():
                print(f"Processing {filename}...")
                questions = parse_question_file(file_path, subject)
                
                # Track seen IDs to handle duplicates
                seen_ids = set()
                
                for q in questions:
                    # Ensure unique ID
                    original_id = q['id']
                    unique_id = original_id
                    counter = 2
                    while unique_id in seen_ids:
                        unique_id = f"{original_id}_{counter}"
                        counter += 1
                    seen_ids.add(unique_id)
                    q['id'] = unique_id
                    
                    sql = f"""INSERT OR REPLACE INTO questions (id, subject, topic, question, options, correct_answer, correct_index, explanation, difficulty) VALUES ({escape_sql(q['id'])}, {escape_sql(q['subject'])}, {escape_sql(q['topic'])}, {escape_sql(q['question'])}, {escape_sql(q['options'])}, {escape_sql(q['correct_answer'])}, {q['correct_index']}, {escape_sql(q['explanation'])}, {escape_sql(q['difficulty'])});\n"""
                    f.write(sql)
                    count += 1
        
        f.write("COMMIT;\n")
        print(f"Generated SQL file with {count} questions at {output_file}")

if __name__ == '__main__':
    generate_sql_file()
