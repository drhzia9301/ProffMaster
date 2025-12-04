"""Fix spelling errors in encrypted files"""
import re
import os

XOR_KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

# Fix wmc L.enc - line 132: "of of" -> "of"
fname = 'wmc L.enc'
with open(f'public/qbanks/{fname}', 'rb') as f:
    data = xor(f.read(), XOR_KEY).decode('utf-8')

# Fix the error
fixed_data = data.replace('symptoms of of vaginal', 'symptoms of vaginal')

# Verify fix
if 'of of' in fixed_data:
    print("WARNING: 'of of' still present!")
else:
    print(f"Fixed 'of of' -> 'of' in {fname}")

# Write back
with open(f'public/qbanks/{fname}', 'wb') as f:
    f.write(xor(fixed_data.encode('utf-8'), XOR_KEY))

print("Done!")
