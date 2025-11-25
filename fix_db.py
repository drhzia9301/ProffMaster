import re
import json

def fix_db():
    path = 'public/assets/initial_db.sql'
    print(f"Reading {path}...")
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Pattern to find INSERT statements with the specific IDs
    # We look for the ID and then the options JSON part
    # This is a bit complex with regex on a huge file, so we'll iterate line by line if possible, 
    # but the file might be minified or have long lines.
    # Let's assume standard INSERT format: VALUES ('id', 'subject', 'topic', 'question', 'options', ...)
    
    # IDs to fix
    target_ids = [
        'medicine_2290',
        'ophthalmology_306',
        'surgery_1903',
        'forensic_medicine_1636',
        'ophthalmology_75'
    ]
    
    fixed_count = 0
    
    # We will split by semicolon to get statements, similar to how the app does it
    statements = content.split(';')
    new_statements = []
    
    for stmt in statements:
        if not stmt.strip():
            new_statements.append(stmt)
            continue
            
        is_target = False
        for tid in target_ids:
            if f"'{tid}'" in stmt:
                is_target = True
                break
        
        if is_target:
            # Find the options JSON array
            # It's usually the 5th value: id, subject, topic, question, options
            # But regex is safer to find the JSON list ['...']
            match = re.search(r"\['[^']+'(?:, '[^']+')*\]", stmt)
            if match:
                json_str = match.group(0).replace("'", '"') # Convert to valid JSON for parsing
                try:
                    options = json.loads(json_str)
                    if len(options) < 4:
                        print(f"Fixing {tid} with {len(options)} options...")
                        # Add dummy options
                        while len(options) < 4:
                            options.append(f"Option {chr(65 + len(options))}")
                        
                        # Convert back to SQL string format (single quotes)
                        new_json_str = json.dumps(options).replace('"', "'")
                        
                        # Replace in statement
                        stmt = stmt.replace(match.group(0), new_json_str)
                        fixed_count += 1
                except json.JSONDecodeError:
                    print(f"Failed to parse JSON for {tid}")
        
        new_statements.append(stmt)
    
    print(f"Fixed {fixed_count} statements.")
    
    new_content = ';'.join(new_statements)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("File saved.")

if __name__ == '__main__':
    fix_db()
