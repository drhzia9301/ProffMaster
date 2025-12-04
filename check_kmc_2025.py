"""Add KMC 2025 questions to existing KMC files"""

XOR_KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

blocks = ['J', 'L', 'M1']

for block in blocks:
    # Read the 2025 file
    with open(f'kmc2025/kmc {block}.enc', 'rb') as f:
        data_2025 = xor(f.read(), XOR_KEY).decode('utf-8')
    
    lines_2025 = [l for l in data_2025.strip().split('\n') if l.strip() and l.startswith('INSERT')]
    
    # Check current year in these files
    years = {}
    for l in lines_2025:
        if "'2023'" in l:
            years['2023'] = years.get('2023', 0) + 1
        elif "'2024'" in l:
            years['2024'] = years.get('2024', 0) + 1
        elif "'2025'" in l:
            years['2025'] = years.get('2025', 0) + 1
        else:
            years['unknown'] = years.get('unknown', 0) + 1
    
    print(f"\nkmc {block} (2025 file): {len(lines_2025)} questions")
    print(f"  Years: {years}")
    
    # Read existing file
    with open(f'public/qbanks/kmc {block}.enc', 'rb') as f:
        data_existing = xor(f.read(), XOR_KEY).decode('utf-8')
    
    lines_existing = [l for l in data_existing.strip().split('\n') if l.strip() and l.startswith('INSERT')]
    
    years_existing = {}
    for l in lines_existing:
        if "'2023'" in l:
            years_existing['2023'] = years_existing.get('2023', 0) + 1
        elif "'2024'" in l:
            years_existing['2024'] = years_existing.get('2024', 0) + 1
        elif "'2025'" in l:
            years_existing['2025'] = years_existing.get('2025', 0) + 1
    
    print(f"kmc {block} (existing): {len(lines_existing)} questions")
    print(f"  Years: {years_existing}")
