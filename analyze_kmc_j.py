"""
Analyze KMC Block J questions to understand duplicates
"""
import re

with open('2023_preproffs/preproff_j.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all KMC question texts using simpler pattern
kmc_positions = [(m.start(), m.end()) for m in re.finditer(r'"id"\s*:\s*"KMC"', content, re.IGNORECASE)]
print(f"Found {len(kmc_positions)} KMC id markers")

# For each KMC marker, find the question text
questions = []
for start, end in kmc_positions:
    # Look for question field after this position
    search_area = content[start:start+3000]
    q_match = re.search(r'"question"\s*:\s*"((?:[^"\\]|\\.)*)"', search_area)
    if q_match:
        questions.append(q_match.group(1))

print(f"Extracted {len(questions)} question texts")

# Check duplicates with first 100 chars
seen = {}
for q in questions:
    key = q[:100].lower().strip()
    if key in seen:
        seen[key].append(q)
    else:
        seen[key] = [q]

unique = [v[0] for v in seen.values()]
duplicates = [(k, v) for k, v in seen.items() if len(v) > 1]

print(f"Unique questions: {len(unique)}")
print(f"Duplicate groups: {len(duplicates)}")
print()

if duplicates:
    print("Duplicate examples:")
    for key, copies in duplicates[:3]:
        print(f"  '{key[:50]}...' appears {len(copies)} times")
