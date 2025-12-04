"""Final summary of all preproff files"""

XOR_KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

import os

files = [f for f in os.listdir('public/qbanks') if f.endswith('.enc')]
files.sort()

total_questions = 0
by_year = {'2023': 0, '2024': 0, '2025': 0}
by_college = {}
by_block = {}

for fname in files:
    with open(f'public/qbanks/{fname}', 'rb') as f:
        data = xor(f.read(), XOR_KEY).decode('utf-8')
    
    lines = [l for l in data.strip().split('\n') if l.strip() and l.startswith('INSERT')]
    total_questions += len(lines)
    
    # Extract college and block from filename
    parts = fname.replace('.enc', '').split(' ')
    college = parts[0].upper()
    block = parts[1] if len(parts) > 1 else 'Unknown'
    
    by_college[college] = by_college.get(college, 0) + len(lines)
    by_block[block] = by_block.get(block, 0) + len(lines)
    
    for l in lines:
        if "'2023'" in l:
            by_year['2023'] += 1
        elif "'2024'" in l:
            by_year['2024'] += 1
        elif "'2025'" in l:
            by_year['2025'] += 1

print("=" * 60)
print("FINAL PREPROFF SUMMARY")
print("=" * 60)
print(f"\nTotal Questions: {total_questions}")
print(f"Total Files: {len(files)}")
print(f"\nBy Year:")
for year, count in sorted(by_year.items()):
    print(f"  {year}: {count}")
print(f"\nBy College:")
for college, count in sorted(by_college.items()):
    print(f"  {college}: {count}")
print(f"\nBy Block:")
for block, count in sorted(by_block.items()):
    print(f"  Block {block}: {count}")
