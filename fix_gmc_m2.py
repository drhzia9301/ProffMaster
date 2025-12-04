"""Deduplicate GMC M2"""

XOR_KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

with open('public/qbanks/gmc M2.enc', 'rb') as f:
    data = xor(f.read(), XOR_KEY).decode('utf-8')

lines = [l for l in data.strip().split('\n') if l.strip()]
print(f'Before: {len(lines)} total')

# Separate by year
y2023 = [l for l in lines if "'2023'" in l]
y2024 = [l for l in lines if "'2024'" in l]
print(f'  2023: {len(y2023)}, 2024: {len(y2024)}')

# Dedupe each year separately
def dedupe(questions):
    seen = set()
    unique = []
    for q in questions:
        # Extract question text
        start = q.find("VALUES ('") + 9
        end = q.find("',", start)
        if start > 8 and end > start:
            key = q[start:end][:80].lower().strip()
            if key not in seen:
                seen.add(key)
                unique.append(q)
    return unique

y2023_deduped = dedupe(y2023)
y2024_deduped = dedupe(y2024)

print(f'After dedupe:')
print(f'  2023: {len(y2023_deduped)}, 2024: {len(y2024_deduped)}')

# Write back
all_questions = y2023_deduped + y2024_deduped
with open('public/qbanks/gmc M2.enc', 'wb') as f:
    f.write(xor('\n'.join(all_questions).encode('utf-8'), XOR_KEY))

print(f'\nSaved gmc M2.enc with {len(all_questions)} questions')
