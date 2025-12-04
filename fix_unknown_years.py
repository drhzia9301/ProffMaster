"""Fix remaining unknown years in specific files"""

XOR_KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

import re

files_to_fix = ['kgmc J.enc', 'nwsm J.enc']

for fname in files_to_fix:
    with open(f'public/qbanks/{fname}', 'rb') as f:
        data = xor(f.read(), XOR_KEY).decode('utf-8')
    
    lines = [l for l in data.strip().split('\n') if l.strip()]
    
    # Count unknown before
    unknown_before = sum(1 for l in lines if "'2023'" not in l and "'2024'" not in l and "'2025'" not in l)
    
    # Fix unknown years -> 2023
    fixed_lines = []
    for l in lines:
        if "'2023'" not in l and "'2024'" not in l and "'2025'" not in l:
            # The year is at the very end: ..., 'XXXX'); or similar
            # Replace any year value with 2023
            l = re.sub(r", '[^']*'\);$", ", '2023');", l)
        fixed_lines.append(l)
    
    # Count unknown after
    unknown_after = sum(1 for l in fixed_lines if "'2023'" not in l and "'2024'" not in l and "'2025'" not in l)
    
    # Write back
    with open(f'public/qbanks/{fname}', 'wb') as f:
        f.write(xor('\n'.join(fixed_lines).encode('utf-8'), XOR_KEY))
    
    print(f"{fname}: fixed {unknown_before - unknown_after} unknown years (remaining: {unknown_after})")
