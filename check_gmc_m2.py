"""Check GMC M2 questions"""

XOR_KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

with open('public/qbanks/gmc M2.enc', 'rb') as f:
    data = xor(f.read(), XOR_KEY).decode('utf-8')

lines = [l for l in data.strip().split('\n') if l.strip()]
print(f'Total GMC M2: {len(lines)}')

# Count by year
y2023 = [l for l in lines if "'2023'" in l]
y2024 = [l for l in lines if "'2024'" in l]
print(f'2023: {len(y2023)}')
print(f'2024: {len(y2024)}')

# Check for duplicates
texts = []
for l in lines:
    start = l.find("VALUES ('") + 9
    end = l.find("',", start)
    if start > 8 and end > start:
        texts.append(l[start:end][:60].lower())

unique = set(texts)
print(f'Unique questions: {len(unique)}')
print(f'Duplicates: {len(texts) - len(unique)}')

# Show some duplicate examples
from collections import Counter
counts = Counter(texts)
dups = [(t, c) for t, c in counts.items() if c > 1]
print(f"\nDuplicate examples (first 5):")
for t, c in dups[:5]:
    print(f"  [{c}x] {t[:50]}...")
