"""
Deep analysis of all question bank .enc files
"""
import os
import re

XOR_KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

def analyze_file(filepath):
    with open(filepath, 'rb') as f:
        data = xor(f.read(), XOR_KEY).decode('utf-8', errors='replace')
    
    lines = [l for l in data.split('\n') if l.strip() and l.startswith('INSERT')]
    
    years = {}
    colleges = {}
    blocks = {}
    
    for l in lines:
        # Extract year
        year_match = re.search(r', (\d{4})\);$', l)
        if year_match:
            y = year_match.group(1)
            years[y] = years.get(y, 0) + 1
        
        # Extract block and college - pattern: 'block', 'college', year
        match = re.search(r"'([JKLM][12]?)', '([^']+)', (\d{4})\);$", l)
        if match:
            b = match.group(1)
            c = match.group(2).lower()
            blocks[b] = blocks.get(b, 0) + 1
            colleges[c] = colleges.get(c, 0) + 1
    
    return {
        'total': len(lines),
        'years': years,
        'colleges': colleges,
        'blocks': blocks,
        'lines': lines
    }

def main():
    print("=" * 80)
    print("DEEP ANALYSIS OF ALL QUESTION BANK FILES")
    print("=" * 80)
    print()
    
    issues = []
    
    for filename in sorted(os.listdir('public/qbanks')):
        if not filename.endswith('.enc'):
            continue
        
        # Parse expected college and block from filename
        # Format: "college block.enc" e.g., "kmc J.enc", "gmc M1.enc"
        parts = filename[:-4].split(' ')
        expected_college = parts[0].lower()
        expected_block = parts[1] if len(parts) > 1 else '?'
        
        filepath = os.path.join('public/qbanks', filename)
        result = analyze_file(filepath)
        
        print(f"\n{'='*60}")
        print(f"FILE: {filename}")
        print(f"Expected: College={expected_college}, Block={expected_block}")
        print(f"Total questions: {result['total']}")
        print(f"Years: {result['years']}")
        print(f"Colleges found: {result['colleges']}")
        print(f"Blocks found: {result['blocks']}")
        
        # Check for mismatches
        for c in result['colleges']:
            if c != expected_college:
                issues.append(f"{filename}: Found college '{c}' but expected '{expected_college}'")
                print(f"  ⚠️ MISMATCH: Found college '{c}'")
        
        for b in result['blocks']:
            if b != expected_block:
                issues.append(f"{filename}: Found block '{b}' but expected '{expected_block}'")
                print(f"  ⚠️ MISMATCH: Found block '{b}'")
    
    print("\n" + "=" * 80)
    print("SUMMARY OF ISSUES")
    print("=" * 80)
    if issues:
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("  No issues found!")
    
    # Specifically analyze kmc J.enc
    print("\n" + "=" * 80)
    print("DETAILED ANALYSIS: kmc J.enc")
    print("=" * 80)
    
    result = analyze_file('public/qbanks/kmc J.enc')
    print(f"Total: {result['total']}")
    print(f"Years: {result['years']}")
    
    # Show sample questions
    print("\nFirst 3 questions (truncated):")
    for i, l in enumerate(result['lines'][:3]):
        # Extract question text
        text_match = re.search(r"VALUES \('([^']{1,100})", l)
        if text_match:
            print(f"  {i+1}. {text_match.group(1)}...")

if __name__ == "__main__":
    main()
