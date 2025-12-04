"""
Fix m1kmc2024.txt misclassification - it's actually M2, not M1.
Also removes duplicates and ensures proper year separation.
"""
import re
import json

XOR_KEY = "SUPERSIX_SECURE_KEY_2025"

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

def read_enc(filepath):
    with open(filepath, 'rb') as f:
        return xor(f.read(), XOR_KEY).decode('utf-8')

def write_enc(filepath, content):
    with open(filepath, 'wb') as f:
        f.write(xor(content.encode('utf-8'), XOR_KEY))

def main():
    print("=" * 60)
    print("Fixing m1kmc2024 → m2 kmc 2024")
    print("=" * 60)
    
    # Read kmc M1.enc
    m1_content = read_enc('public/qbanks/kmc M1.enc')
    m1_lines = [l for l in m1_content.split('\n') if l.strip() and l.startswith('INSERT')]
    print(f"\nkmc M1.enc: {len(m1_lines)} total questions")
    
    # Separate 2024 from non-2024
    m1_2024 = [l for l in m1_lines if "'2024'" in l or ", 2024)" in l]
    m1_other = [l for l in m1_lines if "'2024'" not in l and ", 2024)" not in l]
    print(f"  - 2024 questions: {len(m1_2024)}")
    print(f"  - Other years: {len(m1_other)}")
    
    # These 2024 questions should go to M2
    # Convert them: change 'M1' to 'M2' in the SQL
    m2_additions = []
    for l in m1_2024:
        # Change block from M1 to M2
        fixed = re.sub(r"'M1'", "'M2'", l, flags=re.IGNORECASE)
        fixed = re.sub(r"'m1'", "'M2'", fixed)
        m2_additions.append(fixed)
    
    print(f"\nMoving {len(m2_additions)} questions to M2")
    
    # Write back M1 with only non-2024 questions
    write_enc('public/qbanks/kmc M1.enc', '\n'.join(m1_other))
    print(f"Saved kmc M1.enc with {len(m1_other)} questions")
    
    # Read kmc M2.enc and add the moved questions
    m2_content = read_enc('public/qbanks/kmc M2.enc')
    m2_lines = [l for l in m2_content.split('\n') if l.strip() and l.startswith('INSERT')]
    print(f"\nkmc M2.enc: {len(m2_lines)} existing questions")
    
    # Add the moved questions
    m2_all = m2_lines + m2_additions
    
    # Deduplicate
    seen = set()
    unique = []
    for l in m2_all:
        match = re.search(r"VALUES \('(.{1,80})", l)
        if match:
            key = match.group(1).lower().strip()
            if key not in seen:
                seen.add(key)
                unique.append(l)
        else:
            unique.append(l)
    
    print(f"After dedup: {len(unique)} questions")
    
    write_enc('public/qbanks/kmc M2.enc', '\n'.join(unique))
    print(f"Saved kmc M2.enc with {len(unique)} questions")
    
    # Verify
    print("\n" + "=" * 60)
    print("Verification:")
    
    for name in ['kmc M1.enc', 'kmc M2.enc']:
        content = read_enc(f'public/qbanks/{name}')
        lines = [l for l in content.split('\n') if l.strip() and l.startswith('INSERT')]
        years = {}
        for l in lines:
            for y in ['2023', '2024', '2025']:
                if f"'{y}'" in l or f", {y})" in l:
                    years[y] = years.get(y, 0) + 1
                    break
        print(f"  {name}: {len(lines)} total, years={years}")

if __name__ == "__main__":
    main()
