"""Fix contextual errors in encrypted files"""
import re
import os

XOR_KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

fixes = [
    # File, old text, new text
    ('kmc J.enc', 'difficulty In thinking water', 'difficulty in drinking water'),
    ('gmc M1.enc', 'correct sequence form the codes', 'correct sequence from the codes'),
]

for fname, old_text, new_text in fixes:
    filepath = f'public/qbanks/{fname}'
    
    with open(filepath, 'rb') as f:
        data = xor(f.read(), XOR_KEY).decode('utf-8')
    
    if old_text in data:
        data = data.replace(old_text, new_text)
        print(f"Fixed in {fname}: '{old_text}' -> '{new_text}'")
        
        with open(filepath, 'wb') as f:
            f.write(xor(data.encode('utf-8'), XOR_KEY))
    else:
        print(f"Not found in {fname}: '{old_text}'")

print("\nDone!")
