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

colleges = ['wmc', 'gmc', 'kgmc', 'nwsm', 'kmc']

for college in colleges:
    filepath = os.path.join(output_dir, f'{college} K.enc')
    with open(filepath, 'rb') as f:
        encrypted = f.read()
    decrypted = xor_encrypt_decrypt(encrypted, key).decode('utf-8')
    
    # Extract question texts (first 80 chars each)
    questions = re.findall(r"VALUES \('([^']{1,100})", decrypted)
    
    print(f'\n=== {college.upper()} ({len(questions)} questions) ===')
    for i, q in enumerate(questions[:10], 1):
        print(f'{i}. {q[:70]}...')
    if len(questions) > 10:
        print(f'... and {len(questions) - 10} more questions')
