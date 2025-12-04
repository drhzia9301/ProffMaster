import os
import re
import json

def xor_encrypt_decrypt(data, key):
    key_bytes = key.encode('utf-8')
    key_len = len(key_bytes)
    result = bytearray(len(data))
    for i in range(len(data)):
        result[i] = data[i] ^ key_bytes[i % key_len]
    return result

key = 'SUPERSIX_SECURE_KEY_2025'
output_dir = 'public/qbanks'

def read_encrypted_file(filename):
    filepath = os.path.join(output_dir, filename)
    with open(filepath, 'rb') as f:
        encrypted = f.read()
    return xor_encrypt_decrypt(encrypted, key).decode('utf-8')

def parse_sql_to_questions(sql_content):
    """Parse SQL INSERT statements back to question data."""
    questions = []
    pattern = r"INSERT INTO preproff \(text, options, correct_index, explanation, subject, topic, difficulty, block, college, year\) VALUES \('((?:[^']|'')+)', '((?:[^']|'')+)', (\d+), '((?:[^']|'')*)', '[^']*', '[^']*', '[^']*', '([^']*)', '([^']*)', '([^']*)'\);"
    
    for match in re.finditer(pattern, sql_content):
        text = match.group(1).replace("''", "'")
        options_json = match.group(2).replace("''", "'")
        correct_index = int(match.group(3))
        explanation = match.group(4).replace("''", "'")
        block = match.group(5)
        college = match.group(6)
        year = match.group(7)
        
        try:
            options = json.loads(options_json)
        except:
            options = []
        
        questions.append({
            'text': text,
            'options': options,
            'correct_index': correct_index,
            'explanation': explanation,
            'block': block,
            'college': college,
            'year': year
        })
    return questions

def create_sql_insert(q, block, college, year):
    """Create SQL INSERT statement."""
    text = q['text'].replace("'", "''")
    exp = q['explanation'].replace("'", "''")
    opts_json = json.dumps(q['options']).replace("'", "''")
    return f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{text}', '{opts_json}', {q['correct_index']}, '{exp}', '', '', 'Medium', '{block}', '{college}', '{year}');"

def save_encrypted_file(filename, sql_content):
    filepath = os.path.join(output_dir, filename)
    encrypted_data = xor_encrypt_decrypt(sql_content.encode('utf-8'), key)
    with open(filepath, 'wb') as f:
        f.write(encrypted_data)
    return len(encrypted_data)

# Read Block L files
print("=" * 60)
print("MOVING QUESTIONS FOR BLOCK L")
print("=" * 60)

kmc_sql = read_encrypted_file('kmc L.enc')
wmc_sql = read_encrypted_file('wmc L.enc')
gmc_sql = read_encrypted_file('gmc L.enc')

kmc_questions = parse_sql_to_questions(kmc_sql)
wmc_questions = parse_sql_to_questions(wmc_sql)
gmc_questions = parse_sql_to_questions(gmc_sql)

print(f"\nBefore moving:")
print(f"  KMC: {len(kmc_questions)} questions")
print(f"  WMC: {len(wmc_questions)} questions")
print(f"  GMC: {len(gmc_questions)} questions")

# Cut 5 from KMC and add to GMC
questions_from_kmc = kmc_questions[-5:]  # Take last 5
kmc_questions = kmc_questions[:-5]  # Remove last 5

# Cut 12 from WMC and add to GMC
questions_from_wmc = wmc_questions[-12:]  # Take last 12
wmc_questions = wmc_questions[:-12]  # Remove last 12

# Add to GMC
for q in questions_from_kmc:
    q['college'] = 'GMC'
for q in questions_from_wmc:
    q['college'] = 'GMC'

gmc_questions.extend(questions_from_kmc)
gmc_questions.extend(questions_from_wmc)

print(f"\nAfter moving:")
print(f"  KMC: {len(kmc_questions)} questions (-5)")
print(f"  WMC: {len(wmc_questions)} questions (-12)")
print(f"  GMC: {len(gmc_questions)} questions (+17)")

# Create new SQL content
kmc_sql_new = '\n'.join([create_sql_insert(q, 'L', 'KMC', '2023') for q in kmc_questions])
wmc_sql_new = '\n'.join([create_sql_insert(q, 'L', 'WMC', '2023') for q in wmc_questions])
gmc_sql_new = '\n'.join([create_sql_insert(q, 'L', 'GMC', '2023') for q in gmc_questions])

# Save encrypted files
print("\nSaving encrypted files...")
kmc_size = save_encrypted_file('kmc L.enc', kmc_sql_new)
wmc_size = save_encrypted_file('wmc L.enc', wmc_sql_new)
gmc_size = save_encrypted_file('gmc L.enc', gmc_sql_new)

print(f"  kmc L.enc: {kmc_size} bytes")
print(f"  wmc L.enc: {wmc_size} bytes")
print(f"  gmc L.enc: {gmc_size} bytes")

# Verify encryption works
print("\n" + "=" * 60)
print("VERIFYING ENCRYPTION")
print("=" * 60)

for filename in ['kmc L.enc', 'wmc L.enc', 'gmc L.enc']:
    filepath = os.path.join(output_dir, filename)
    
    # Read encrypted
    with open(filepath, 'rb') as f:
        encrypted = f.read()
    
    # Check it's not plain text
    try:
        encrypted.decode('utf-8')
        is_encrypted = False
    except:
        is_encrypted = True
    
    # Decrypt and verify
    decrypted = xor_encrypt_decrypt(encrypted, key).decode('utf-8')
    question_count = decrypted.count('INSERT INTO preproff')
    
    # Check decryption produces valid SQL
    is_valid_sql = 'INSERT INTO preproff' in decrypted and 'VALUES' in decrypted
    
    print(f"\n{filename}:")
    print(f"  File size: {len(encrypted)} bytes")
    print(f"  Encrypted (not readable as text): {'✅ Yes' if is_encrypted else '⚠️ Partially readable'}")
    print(f"  Decrypts to valid SQL: {'✅ Yes' if is_valid_sql else '❌ No'}")
    print(f"  Questions after decryption: {question_count}")

# Show sample of encrypted vs decrypted
print("\n" + "=" * 60)
print("ENCRYPTION SAMPLE (first 100 bytes)")
print("=" * 60)

with open(os.path.join(output_dir, 'gmc L.enc'), 'rb') as f:
    encrypted_sample = f.read()[:100]

print(f"\nEncrypted (hex): {encrypted_sample.hex()[:100]}...")
print(f"Encrypted (raw): {repr(encrypted_sample[:50])}...")

decrypted_sample = xor_encrypt_decrypt(encrypted_sample, key).decode('utf-8', errors='ignore')
print(f"Decrypted: {decrypted_sample}...")

print("\n✅ All operations completed successfully!")
