import os
import re
import json

def xor_encrypt_decrypt(data, key):
    key_bytes = key.encode('utf-8')
    key_len = len(key_bytes)
    result = bytearray(len(data))
    for i in range(len(data)):
        result[i] = data[i] ^ key_bytes[i % key_len]
    return result

key = 'SUPERSIX_SECURE_KEY_2025'
output_dir = 'public/qbanks'

# Get all encrypted files
files = sorted([f for f in os.listdir(output_dir) if f.endswith('.enc')])

print("=" * 70)
print("REMOVING CROSS-FILE DUPLICATES")
print("=" * 70)

# First pass: collect all questions and find duplicates
all_questions = {}  # normalized_text -> list of (file, question_num, full_sql_line)

file_contents = {}  # filename -> list of SQL lines

for filename in files:
    filepath = os.path.join(output_dir, filename)
    with open(filepath, 'rb') as f:
        encrypted = f.read()
    decrypted = xor_encrypt_decrypt(encrypted, key).decode('utf-8')
    
    # Split into individual SQL statements
    sql_lines = [line.strip() for line in decrypted.split('\n') if line.strip().startswith('INSERT')]
    file_contents[filename] = sql_lines
    
    for i, sql in enumerate(sql_lines):
        # Extract question text
        match = re.search(r"VALUES \('([^']+)'", sql)
        if match:
            q_text = match.group(1)
            q_normalized = ' '.join(q_text.lower().split())[:150]
            
            if q_normalized not in all_questions:
                all_questions[q_normalized] = []
            all_questions[q_normalized].append((filename, i, sql))

# Find cross-file duplicates
duplicates_to_remove = {}  # filename -> set of indices to remove

for q_norm, occurrences in all_questions.items():
    if len(occurrences) > 1:
        files_involved = set([occ[0] for occ in occurrences])
        
        if len(files_involved) > 1:
            # Cross-file duplicate - keep the first occurrence, remove the rest
            # Sort by filename to be consistent
            sorted_occs = sorted(occurrences, key=lambda x: x[0])
            
            # Keep first, mark others for removal
            for filename, idx, sql in sorted_occs[1:]:
                if filename not in duplicates_to_remove:
                    duplicates_to_remove[filename] = set()
                duplicates_to_remove[filename].add(idx)
                print(f"  Removing from {filename}: Q{idx+1}")

print(f"\nTotal duplicates to remove: {sum(len(v) for v in duplicates_to_remove.values())}")

# Second pass: remove duplicates and save
print("\n" + "=" * 70)
print("SAVING CLEANED FILES")
print("=" * 70)

for filename in files:
    if filename in duplicates_to_remove:
        original_count = len(file_contents[filename])
        indices_to_remove = duplicates_to_remove[filename]
        
        # Filter out the duplicate lines
        cleaned_lines = [sql for i, sql in enumerate(file_contents[filename]) if i not in indices_to_remove]
        
        new_count = len(cleaned_lines)
        
        # Save the cleaned file
        sql_content = '\n'.join(cleaned_lines)
        encrypted_data = xor_encrypt_decrypt(sql_content.encode('utf-8'), key)
        
        filepath = os.path.join(output_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(encrypted_data)
        
        print(f"  {filename}: {original_count} -> {new_count} (removed {original_count - new_count})")

# Verify
print("\n" + "=" * 70)
print("VERIFICATION - Final Question Counts")
print("=" * 70)

total = 0
for filename in files:
    filepath = os.path.join(output_dir, filename)
    with open(filepath, 'rb') as f:
        encrypted = f.read()
    decrypted = xor_encrypt_decrypt(encrypted, key).decode('utf-8')
    count = decrypted.count('INSERT INTO preproff')
    total += count
    print(f"  {filename}: {count} questions")

print(f"\nTotal questions: {total}")
print("\n✅ All duplicates removed successfully!")
