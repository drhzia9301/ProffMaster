"""Fix all preproff files - remove duplicates and fix years"""

XOR_KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

import os

files = [f for f in os.listdir('public/qbanks') if f.endswith('.enc')]
files.sort()

print("=" * 80)
print("FIXING ALL PREPROFF FILES")
print("=" * 80)

total_removed = 0
total_fixed_years = 0

for fname in files:
    with open(f'public/qbanks/{fname}', 'rb') as f:
        data = xor(f.read(), XOR_KEY).decode('utf-8')
    
    lines = [l for l in data.strip().split('\n') if l.strip()]
    original_count = len(lines)
    
    # Fix unknown years -> 2023
    fixed_lines = []
    year_fixes = 0
    for l in lines:
        if "'2023'" not in l and "'2024'" not in l and "'2025'" not in l:
            # Replace the year at the end of the INSERT statement
            # The year is the last value before the closing );
            import re
            l = re.sub(r"'[^']*'\);$", "'2023');", l)
            year_fixes += 1
        fixed_lines.append(l)
    
    lines = fixed_lines
    
    # Deduplicate
    seen = set()
    unique_lines = []
    for l in lines:
        start = l.find("VALUES ('") + 9
        end = l.find("',", start)
        if start > 8 and end > start:
            key = l[start:end][:80].lower().strip()
            if key not in seen:
                seen.add(key)
                unique_lines.append(l)
        else:
            unique_lines.append(l)
    
    removed = original_count - len(unique_lines)
    
    if removed > 0 or year_fixes > 0:
        # Write back
        with open(f'public/qbanks/{fname}', 'wb') as f:
            f.write(xor('\n'.join(unique_lines).encode('utf-8'), XOR_KEY))
        
        print(f"{fname}: {original_count} -> {len(unique_lines)} (-{removed} dups, {year_fixes} year fixes)")
        total_removed += removed
        total_fixed_years += year_fixes

print("\n" + "=" * 80)
print(f"DONE: Removed {total_removed} duplicates, Fixed {total_fixed_years} years")
print("=" * 80)
