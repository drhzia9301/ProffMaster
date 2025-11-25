import re
import json

def fix_db():
    path = 'public/assets/initial_db.sql'
    print(f"Reading {path}...")
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # The grep output suggests the format might be different or my previous regex was too strict.
    # Let's try a more robust approach: find the ID, then find the NEXT list [...]
    
    target_ids = [
        'ent_623',
        'ent_642',
        'forensic_medicine_1636'
    ]
    
    fixed_count = 0
    
    # We'll use a regex that finds the ID and captures the whole line or statement
    # Assuming one INSERT per line or similar structure
    
    for tid in target_ids:
        # Regex to find the ID and the options list in the same statement
        # Look for 'tid' ... ['opt1', 'opt2']
        pattern = re.compile(f"'{tid}'.*?(\\[.*?\\])", re.DOTALL)
        match = pattern.search(content)
        
        if match:
            original_json = match.group(1)
            # Fix quotes for JSON parsing
            json_str = original_json.replace("'", '"')
            try:
                options = json.loads(json_str)
                if len(options) < 4:
                    print(f"Fixing {tid} with {len(options)} options...")
                    while len(options) < 4:
                        options.append(f"Option {chr(65 + len(options))}")
                    
                    # Convert back to SQL format
                    new_json_str = json.dumps(options).replace('"', "'")
                    
                    # Replace ONLY this occurrence
                    content = content.replace(original_json, new_json_str, 1)
                    fixed_count += 1
            except json.JSONDecodeError:
                print(f"Failed to parse JSON for {tid}: {original_json[:50]}...")
        else:
            print(f"Could not find ID {tid}")

    print(f"Fixed {fixed_count} statements.")
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("File saved.")

if __name__ == '__main__':
    fix_db()
