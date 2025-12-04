"""Check all preproff files for potential issues"""

XOR_KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

import os

files = [f for f in os.listdir('public/qbanks') if f.endswith('.enc')]
files.sort()

print("=" * 80)
print("PREPROFF FILE ANALYSIS - Checking for duplicates and issues")
print("=" * 80)

issues = []

for fname in files:
    with open(f'public/qbanks/{fname}', 'rb') as f:
        data = xor(f.read(), XOR_KEY).decode('utf-8')
    
    lines = [l for l in data.strip().split('\n') if l.strip()]
    
    # Count by year
    years = {}
    for l in lines:
        if "'2023'" in l:
            years['2023'] = years.get('2023', 0) + 1
        elif "'2024'" in l:
            years['2024'] = years.get('2024', 0) + 1
        elif "'2025'" in l:
            years['2025'] = years.get('2025', 0) + 1
        else:
            years['unknown'] = years.get('unknown', 0) + 1
    
    # Check for duplicates
    texts = []
    for l in lines:
        start = l.find("VALUES ('") + 9
        end = l.find("',", start)
        if start > 8 and end > start:
            texts.append(l[start:end][:80].lower().strip())
    
    unique_count = len(set(texts))
    dup_count = len(texts) - unique_count
    
    # Flag issues
    has_issue = False
    issue_reasons = []
    
    # Check if any year has > 120 questions
    for year, count in years.items():
        if count > 120:
            has_issue = True
            issue_reasons.append(f"{year}={count} (>120)")
    
    if dup_count > 0:
        has_issue = True
        issue_reasons.append(f"{dup_count} duplicates")
    
    # Print
    year_str = ", ".join([f"{y}:{c}" for y, c in sorted(years.items())])
    status = "⚠️ ISSUE" if has_issue else "✓"
    
    print(f"\n{fname}")
    print(f"  Total: {len(lines)}, Unique: {unique_count}, Years: {year_str}")
    if has_issue:
        print(f"  {status}: {', '.join(issue_reasons)}")
        issues.append((fname, issue_reasons))

print("\n" + "=" * 80)
print(f"SUMMARY: {len(issues)} files with potential issues")
print("=" * 80)

for fname, reasons in issues:
    print(f"  - {fname}: {', '.join(reasons)}")
