"""Fix fragmented SQL lines in all files"""

XOR_KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

import os

files = [f for f in os.listdir('public/qbanks') if f.endswith('.enc')]
files.sort()

print("Fixing fragmented SQL lines...")

for fname in files:
    with open(f'public/qbanks/{fname}', 'rb') as f:
        data = xor(f.read(), XOR_KEY).decode('utf-8')
    
    lines = [l for l in data.strip().split('\n') if l.strip()]
    
    # Merge non-INSERT lines with previous INSERT line
    merged_lines = []
    for l in lines:
        if l.startswith('INSERT'):
            merged_lines.append(l)
        elif merged_lines:
            # Append to previous line
            merged_lines[-1] = merged_lines[-1] + ' ' + l
    
    # Count how many lines don't have a valid year
    no_year = [l for l in merged_lines if "'2023'" not in l and "'2024'" not in l and "'2025'" not in l]
    
    if len(lines) != len(merged_lines) or no_year:
        # Dedupe after merge
        seen = set()
        unique_lines = []
        for l in merged_lines:
            start = l.find("VALUES ('") + 9
            end = l.find("',", start)
            if start > 8 and end > start:
                key = l[start:end][:80].lower().strip()
                if key not in seen:
                    seen.add(key)
                    unique_lines.append(l)
            else:
                unique_lines.append(l)
        
        with open(f'public/qbanks/{fname}', 'wb') as f:
            f.write(xor('\n'.join(unique_lines).encode('utf-8'), XOR_KEY))
        
        print(f"{fname}: {len(lines)} -> {len(unique_lines)} (merged {len(lines) - len(merged_lines)} fragments)")

print("\nDone!")
