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

# Check all encrypted files
files = [f for f in os.listdir(output_dir) if f.endswith('.enc')]

print("=" * 60)
print("CHECKING FOR DUPLICATE QUESTIONS")
print("=" * 60)

total_duplicates = 0

for filename in sorted(files):
    filepath = os.path.join(output_dir, filename)
    with open(filepath, 'rb') as f:
        encrypted = f.read()
    decrypted = xor_encrypt_decrypt(encrypted, key).decode('utf-8')
    
    # Extract question texts
    questions = re.findall(r"VALUES \('([^']+)'", decrypted)
    
    # Find duplicates
    seen = {}
    duplicates = []
    for i, q in enumerate(questions, 1):
        # Normalize: lowercase, remove extra spaces
        q_normalized = ' '.join(q.lower().split())[:150]  # First 150 chars
        
        if q_normalized in seen:
            duplicates.append((i, seen[q_normalized], q[:80]))
        else:
            seen[q_normalized] = i
    
    unique_count = len(questions) - len(duplicates)
    
    if duplicates:
        print(f"\n❌ {filename}: {len(questions)} total, {len(duplicates)} duplicates found")
        for dup_num, orig_num, q_text in duplicates[:5]:  # Show first 5
            print(f"   Q{dup_num} duplicates Q{orig_num}: {q_text}...")
        if len(duplicates) > 5:
            print(f"   ... and {len(duplicates) - 5} more duplicates")
        total_duplicates += len(duplicates)
    else:
        print(f"✅ {filename}: {len(questions)} questions, all unique")

print("\n" + "=" * 60)
print(f"TOTAL DUPLICATES FOUND: {total_duplicates}")
print("=" * 60)
