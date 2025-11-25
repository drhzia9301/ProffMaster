import json
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Initialize Supabase client
url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_ANON_KEY')

if not url or not key:
    print("Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local")
    exit(1)

supabase: Client = create_client(url, key)

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

def parse_question_file(file_path, subject):
    """Parse a question bank text file and return list of questions"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Parse JSON array
    try:
        questions_raw = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"Error parsing {file_path}: {e}")
        return []
    
    questions = []
    for q in questions_raw:
        # Find correct index
        correct_answer = q.get('answer', '')
        options = q.get('options', [])
        correct_index = -1
        
        for i, opt in enumerate(options):
            if opt == correct_answer:
                correct_index = i
                break
        
        question_obj = {
            'id': f"{subject.lower().replace(' ', '_')}_{q.get('id', 0)}",
            'subject': subject,
            'topic': q.get('topic', 'General'),
            'question': q.get('question', ''),
            'options': json.dumps(options),  # Store as JSON string
            'correct_answer': correct_answer,
            'correct_index': correct_index,
            'explanation': q.get('explanation', ''),
            'difficulty': 'Medium'  # Default difficulty
        }
        questions.append(question_obj)
    
    return questions

def upload_to_supabase(questions, batch_size=100):
    """Upload questions to Supabase in batches"""
    total = len(questions)
    print(f"Uploading {total} questions to Supabase...")
    
    for i in range(0, total, batch_size):
        batch = questions[i:i+batch_size]
        try:
            response = supabase.table('questions').upsert(batch).execute()
            print(f"Uploaded batch {i//batch_size + 1}: {len(batch)} questions")
        except Exception as e:
            print(f"Error uploading batch {i//batch_size + 1}: {e}")
            # Try uploading one by one to identify problematic questions
            for q in batch:
                try:
                    supabase.table('questions').upsert([q]).execute()
                except Exception as e2:
                    print(f"  Failed to upload question {q['id']}: {e2}")

def main():
    qbanks_dir = Path('qbanks')
    all_questions = []
    
    # Parse all question bank files
    for filename, subject in SUBJECT_MAP.items():
        file_path = qbanks_dir / filename
        if file_path.exists():
            print(f"Parsing {filename} ({subject})...")
            questions = parse_question_file(file_path, subject)
            print(f"  Found {len(questions)} questions")
            all_questions.extend(questions)
        else:
            print(f"Warning: {filename} not found")
    
    print(f"\nTotal questions parsed: {len(all_questions)}")
    
    # Upload to Supabase
    if all_questions:
        upload_to_supabase(all_questions)
        print("\n✅ Upload complete!")
    else:
        print("\n❌ No questions to upload")

if __name__ == '__main__':
    main()
