"""
Remove duplicates from all .enc files
"""
import os
import re

XOR_KEY = "SUPERSIX_SECURE_KEY_2025"

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

def dedupe_file(filepath):
    with open(filepath, 'rb') as f:
        content = xor(f.read(), XOR_KEY).decode('utf-8')
    
    lines = [l for l in content.split('\n') if l.strip() and l.startswith('INSERT')]
    original_count = len(lines)
    
    # Dedupe based on question text (first 100 chars)
    seen = set()
    unique = []
    for l in lines:
        match = re.search(r"VALUES \('(.{1,100})", l)
        if match:
            key = match.group(1).lower().strip()
            if key not in seen:
                seen.add(key)
                unique.append(l)
        else:
            unique.append(l)
    
    removed = original_count - len(unique)
    
    if removed > 0:
        with open(filepath, 'wb') as f:
            f.write(xor('\n'.join(unique).encode('utf-8'), XOR_KEY))
    
    return original_count, len(unique), removed

def main():
    print("=" * 60)
    print("Removing duplicates from all .enc files")
    print("=" * 60)
    
    total_removed = 0
    
    for filename in sorted(os.listdir('public/qbanks')):
        if not filename.endswith('.enc'):
            continue
        
        filepath = f'public/qbanks/{filename}'
        before, after, removed = dedupe_file(filepath)
        
        if removed > 0:
            print(f"  {filename}: {before} → {after} (removed {removed} duplicates)")
            total_removed += removed
        else:
            print(f"  {filename}: {after} (no duplicates)")
    
    print("\n" + "=" * 60)
    print(f"Total duplicates removed: {total_removed}")

if __name__ == "__main__":
    main()
