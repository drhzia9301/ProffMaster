import sqlite3
import os

def test_sql():
    print("Testing SQL file execution...")
    path = 'public/assets/initial_db.sql'
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    with open(path, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Split exactly like the app does
    # The app splits by ';' and filters empty strings
    statements = [s.strip() for s in sql_content.split(';') if s.strip()]
    
    print(f"Found {len(statements)} statements.")
    
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()
    
    errors = 0
    success = 0
    
    for i, stmt in enumerate(statements):
        # Skip transaction commands for individual execution testing
        if stmt.upper() in ['BEGIN TRANSACTION', 'COMMIT']:
            continue
            
        try:
            cursor.execute(stmt)
            success += 1
        except sqlite3.Error as e:
            errors += 1
            if errors <= 10: # Print first 10 errors
                print(f"\nError #{errors} in statement {i}: {e}")
                print(f"Statement snippet: {stmt[:200]}...")
    
    print(f"\nSummary: {success} successful, {errors} failed.")
    
    # Check final count
    cursor.execute("SELECT COUNT(*) FROM questions")
    count = cursor.fetchone()[0]
    print(f"Final row count in DB: {count}")
    
    # Check for duplicates in the source statements (by ID)
    import re
    id_pattern = re.compile(r"VALUES \('([^']+)'")
    ids = []
    for stmt in statements:
        match = id_pattern.search(stmt)
        if match:
            ids.append(match.group(1))
            
    print(f"Found {len(ids)} IDs in SQL statements.")
    unique_ids = set(ids)
    print(f"Unique IDs: {len(unique_ids)}")
    if len(ids) != len(unique_ids):
        print(f"Duplicate IDs found: {len(ids) - len(unique_ids)}")

if __name__ == '__main__':
    test_sql()
