"""
Comprehensive analysis of all question bank files
"""
import os
import re

XOR_KEY = "SUPERSIX_SECURE_KEY_2025"

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

def analyze_file(filepath):
    with open(filepath, 'rb') as f:
        content = xor(f.read(), XOR_KEY).decode('utf-8', errors='replace')
    
    lines = [l for l in content.split('\n') if l.strip() and l.startswith('INSERT')]
    
    years = {}
    colleges = {}
    blocks = {}
    
    for l in lines:
        # Try to extract year, college, block from the end of the SQL
        # Pattern: 'block', 'college', 'year'); or 'block', 'college', year);
        match = re.search(r"'([^']+)',\s*'([^']+)',\s*'?(\d{4})'?\);?$", l)
        if match:
            b = match.group(1).upper()
            c = match.group(2).lower()
            y = match.group(3)
            blocks[b] = blocks.get(b, 0) + 1
            colleges[c] = colleges.get(c, 0) + 1
            years[y] = years.get(y, 0) + 1
    
    return {
        'total': len(lines),
        'years': years,
        'colleges': colleges,
        'blocks': blocks
    }

def main():
    print("=" * 80)
    print("COMPREHENSIVE QUESTION BANK ANALYSIS")
    print("=" * 80)
    
    all_files = sorted(os.listdir('public/qbanks'))
    issues = []
    
    for filename in all_files:
        if not filename.endswith('.enc'):
            continue
        
        # Expected from filename
        parts = filename[:-4].split(' ')
        exp_college = parts[0].lower()
        exp_block = parts[1].upper() if len(parts) > 1 else '?'
        
        result = analyze_file(f'public/qbanks/{filename}')
        
        print(f"\n{filename}")
        print(f"  Expected: college={exp_college}, block={exp_block}")
        print(f"  Total: {result['total']}")
        print(f"  Years: {result['years']}")
        print(f"  Colleges in data: {result['colleges']}")
        print(f"  Blocks in data: {result['blocks']}")
        
        # Check mismatches
        for c in result['colleges']:
            if c != exp_college:
                msg = f"{filename}: Contains college '{c}' but expected '{exp_college}'"
                issues.append(msg)
                print(f"  ⚠️ {msg}")
        
        for b in result['blocks']:
            if b != exp_block:
                msg = f"{filename}: Contains block '{b}' but expected '{exp_block}'"
                issues.append(msg)
                print(f"  ⚠️ {msg}")
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    if issues:
        print(f"\n⚠️ Found {len(issues)} issues:")
        for i in issues:
            print(f"  - {i}")
    else:
        print("\n✓ All files have correctly matched college and block data!")
    
    # Summary table
    print("\n" + "-" * 60)
    print("Question counts by file:")
    print("-" * 60)
    
    total = 0
    for filename in all_files:
        if filename.endswith('.enc'):
            result = analyze_file(f'public/qbanks/{filename}')
            year_str = ', '.join([f"{y}:{c}" for y,c in sorted(result['years'].items())])
            print(f"  {filename:20} {result['total']:4} questions  [{year_str}]")
            total += result['total']
    
    print("-" * 60)
    print(f"  {'TOTAL':20} {total:4} questions")

if __name__ == "__main__":
    main()
