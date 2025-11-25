import sqlite3
import os
import json

def check_options():
    print("Checking for questions with fewer than 4 options...")
    path = 'public/assets/initial_db.sql'
    
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    with open(path, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Split exactly like the app does
    statements = [s.strip() for s in sql_content.split(';') if s.strip()]
    
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()
    
    # Execute statements to build DB
    for stmt in statements:
        if stmt.upper() in ['BEGIN TRANSACTION', 'COMMIT']:
            continue
        try:
            cursor.execute(stmt)
        except sqlite3.Error:
            pass # Ignore errors for this check
            
    # Query
    cursor.execute("SELECT id, question, options FROM questions")
    rows = cursor.fetchall()
    
    count = 0
    print("\n--- Results ---")
    for row in rows:
        qid, question, options_json = row
        try:
            options = json.loads(options_json)
            if len(options) < 4:
                count += 1
                print(f"[ID: {qid}] has {len(options)} options: {options}")
                print(f"Question: {question[:50]}...")
        except json.JSONDecodeError:
            print(f"[ID: {qid}] Invalid JSON options")
            
    print(f"\nTotal questions with < 4 options: {count}")

if __name__ == '__main__':
    check_options()
