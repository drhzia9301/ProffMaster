"""Analyze GMC M2 source files"""
import re

# Check preproff_m2.txt for GMC entries
with open('2023_preproffs/preproff_m2.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract all GMC entries
pattern = re.compile(
    r'\{\s*'
    r'"id"\s*:\s*"([^"]+)"\s*,\s*'
    r'"block"\s*:\s*"([^"]+)"\s*,\s*'
    r'"year"\s*:\s*"([^"]+)"',
    re.DOTALL
)

gmc_entries = []
for match in pattern.finditer(content):
    college = match.group(1).upper()
    block = match.group(2).upper()
    year = match.group(3)
    if college == 'GMC' and block == 'M2':
        gmc_entries.append(year)

print(f"GMC M2 in preproff_m2.txt: {len(gmc_entries)}")
from collections import Counter
print(Counter(gmc_entries))
