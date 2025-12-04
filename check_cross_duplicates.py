import os
import re

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
print("CROSS-FILE DUPLICATE ANALYSIS FOR 2023 PREPROFFS")
print("=" * 70)

# Collect all questions with their source
all_questions = {}  # normalized_text -> list of (file, question_num, original_text)

for filename in files:
    filepath = os.path.join(output_dir, filename)
    with open(filepath, 'rb') as f:
        encrypted = f.read()
    decrypted = xor_encrypt_decrypt(encrypted, key).decode('utf-8')
    
    # Extract question texts
    questions = re.findall(r"VALUES \('([^']+)'", decrypted)
    
    for i, q in enumerate(questions, 1):
        # Normalize: lowercase, remove extra spaces, first 150 chars
        q_normalized = ' '.join(q.lower().split())[:150]
        
        if q_normalized not in all_questions:
            all_questions[q_normalized] = []
        all_questions[q_normalized].append((filename, i, q[:80]))

# Find duplicates (questions appearing in multiple files)
cross_file_duplicates = {}
within_file_duplicates = {}

for q_norm, occurrences in all_questions.items():
    if len(occurrences) > 1:
        # Check if duplicates are across different files or within same file
        files_involved = set([occ[0] for occ in occurrences])
        
        if len(files_involved) > 1:
            # Cross-file duplicate
            cross_file_duplicates[q_norm] = occurrences
        else:
            # Within same file duplicate
            within_file_duplicates[q_norm] = occurrences

# Report cross-file duplicates
print("\n" + "=" * 70)
print("CROSS-FILE DUPLICATES (Same question in different files)")
print("=" * 70)

if cross_file_duplicates:
    # Group by file pairs
    file_pair_counts = {}
    for q_norm, occurrences in cross_file_duplicates.items():
        files_list = sorted(set([occ[0] for occ in occurrences]))
        pair_key = " <-> ".join(files_list)
        if pair_key not in file_pair_counts:
            file_pair_counts[pair_key] = []
        file_pair_counts[pair_key].append((q_norm, occurrences))
    
    print(f"\nTotal cross-file duplicates: {len(cross_file_duplicates)}")
    print("\nBreakdown by file pairs:")
    
    for pair, dups in sorted(file_pair_counts.items(), key=lambda x: -len(x[1])):
        print(f"\n  {pair}: {len(dups)} duplicates")
        # Show first 3 examples
        for q_norm, occurrences in dups[:3]:
            print(f"    • \"{occurrences[0][2]}...\"")
            for filename, q_num, _ in occurrences:
                print(f"      - {filename} (Q{q_num})")
        if len(dups) > 3:
            print(f"    ... and {len(dups) - 3} more")
else:
    print("\n✅ No cross-file duplicates found!")

# Report within-file duplicates
print("\n" + "=" * 70)
print("WITHIN-FILE DUPLICATES (Same question repeated in same file)")
print("=" * 70)

if within_file_duplicates:
    print(f"\nTotal within-file duplicates: {len(within_file_duplicates)}")
    
    # Group by file
    file_dup_counts = {}
    for q_norm, occurrences in within_file_duplicates.items():
        filename = occurrences[0][0]
        if filename not in file_dup_counts:
            file_dup_counts[filename] = 0
        file_dup_counts[filename] += 1
    
    for filename, count in sorted(file_dup_counts.items(), key=lambda x: -x[1]):
        print(f"  {filename}: {count} internal duplicates")
else:
    print("\n✅ No within-file duplicates found!")

# Summary by block
print("\n" + "=" * 70)
print("SUMMARY BY BLOCK")
print("=" * 70)

blocks = {'J': [], 'K': [], 'L': [], 'M1': [], 'M2': []}
for filename in files:
    for block in blocks:
        if f" {block}.enc" in filename:
            blocks[block].append(filename)

for block, block_files in blocks.items():
    if not block_files:
        continue
    
    # Count cross-file dups within this block
    block_dups = 0
    for q_norm, occurrences in cross_file_duplicates.items():
        files_in_dup = set([occ[0] for occ in occurrences])
        if any(f in files_in_dup for f in block_files):
            block_dups += 1
    
    total_qs = 0
    for f in block_files:
        filepath = os.path.join(output_dir, f)
        with open(filepath, 'rb') as file:
            encrypted = file.read()
        decrypted = xor_encrypt_decrypt(encrypted, key).decode('utf-8')
        total_qs += decrypted.count('INSERT INTO preproff')
    
    print(f"\nBlock {block}:")
    print(f"  Files: {len(block_files)}")
    print(f"  Total questions: {total_qs}")
    print(f"  Cross-file duplicates involving this block: {block_dups}")

print("\n" + "=" * 70)
print("GRAND TOTAL")
print("=" * 70)
total_questions = sum(len(occs) for occs in all_questions.values())
unique_questions = len(all_questions)
print(f"\nTotal question entries: {total_questions}")
print(f"Unique questions: {unique_questions}")
print(f"Cross-file duplicates: {len(cross_file_duplicates)}")
print(f"Within-file duplicates: {len(within_file_duplicates)}")
