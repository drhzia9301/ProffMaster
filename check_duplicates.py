import json
import re
import os

SOURCE = r'c:\Users\haroo\Desktop\ProffMaster\2023_preproffs\2024-25\nwsm2025'
QBANKS = r'c:\Users\haroo\Desktop\ProffMaster\public\qbanks'
KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor_cipher(text, key):
    return ''.join(chr(ord(c) ^ ord(key[i % len(key)])) for i, c in enumerate(text))

def get_questions_from_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    pattern = r'\{\s*"id"\s*:\s*"[^"]*"[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    questions = []
    for m in re.findall(pattern, content, re.DOTALL):
        try:
            obj = json.loads(m)
            q = obj.get('question', '')[:100].lower().strip()
            questions.append(q)
        except:
            pass
    return questions

def get_questions_from_enc(filepath, year_filter=None):
    with open(filepath, 'rb') as f:
        encrypted = f.read().decode('latin-1')
    decrypted = xor_cipher(encrypted, KEY)
    
    questions = []
    for m in re.finditer(r"VALUES \('([^']*)'.*?'(\d{4})'\)", decrypted):
        q = m.group(1)[:100].lower().strip()
        year = m.group(2)
        if year_filter is None or year == year_filter:
            questions.append((q, year))
    return questions

files = [
    ('jnwsm2025.txt', 'nwsm J.enc', 'J'),
    ('knwsm2025.txt', 'nwsm K.enc', 'K'),
    ('lnwsm2025.txt', 'nwsm L.enc', 'L'),
    ('m1nwsm2025.txt', 'nwsm M1.enc', 'M1'),
    ('m2nwsm2025.txt', 'nwsm M2.enc', 'M2'),
]

from collections import Counter

print("Duplicate Analysis by Block:")
print("=" * 70)

for json_file, enc_file, block in files:
    json_questions = get_questions_from_json(os.path.join(SOURCE, json_file))
    enc_questions = get_questions_from_enc(os.path.join(QBANKS, enc_file))
    
    q_2023 = set(q for q, y in enc_questions if y == '2023')
    
    # Check duplicates with 2023
    dups_2023 = sum(1 for q in json_questions if q in q_2023)
    
    # Check self-duplicates
    counter = Counter(json_questions)
    self_dups = sum(c - 1 for q, c in counter.items() if c > 1)
    
    total_skipped = dups_2023 + self_dups
    
    print(f"\nBlock {block}:")
    print(f"  JSON questions: {len(json_questions)}")
    print(f"  Duplicates with 2023: {dups_2023}")
    print(f"  Self-duplicates in JSON: {self_dups}")
    print(f"  Expected to add: {len(json_questions) - total_skipped}")
