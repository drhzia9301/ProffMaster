"""
Move 14 questions from WMC J 2023 to NWSM J 2023
"""

XOR_KEY = "SUPERSIX_SECURE_KEY_2025"

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

def main():
    # Read WMC J.enc
    with open('public/qbanks/wmc J.enc', 'rb') as f:
        wmc_data = xor(f.read(), XOR_KEY).decode('utf-8')
    
    wmc_lines = [l for l in wmc_data.strip().split('\n') if l.strip()]
    
    # Separate by year
    wmc_2023 = [l for l in wmc_lines if "'2023'" in l]
    wmc_2025 = [l for l in wmc_lines if "'2025'" in l]
    
    print(f"WMC before: 2023={len(wmc_2023)}, 2025={len(wmc_2025)}")
    
    # Take 14 from WMC 2023
    to_move = wmc_2023[-14:]
    wmc_2023 = wmc_2023[:-14]
    
    print(f"WMC after: 2023={len(wmc_2023)}, 2025={len(wmc_2025)}")
    
    # Convert moved questions to NWSM
    nwsm_new = []
    for line in to_move:
        # Change 'wmc' to 'nwsm' in the SQL
        nwsm_new.append(line.replace("'wmc'", "'nwsm'"))
    
    # Read NWSM J.enc
    with open('public/qbanks/nwsm J.enc', 'rb') as f:
        nwsm_data = xor(f.read(), XOR_KEY).decode('utf-8')
    
    nwsm_lines = [l for l in nwsm_data.strip().split('\n') if l.strip()]
    print(f"NWSM before: {len(nwsm_lines)}")
    
    # Add moved questions
    nwsm_lines.extend(nwsm_new)
    print(f"NWSM after: {len(nwsm_lines)}")
    
    # Write back WMC J.enc
    all_wmc = wmc_2023 + wmc_2025
    with open('public/qbanks/wmc J.enc', 'wb') as f:
        f.write(xor('\n'.join(all_wmc).encode('utf-8'), XOR_KEY))
    print(f"\nSaved wmc J.enc with {len(all_wmc)} questions")
    
    # Write back NWSM J.enc
    with open('public/qbanks/nwsm J.enc', 'wb') as f:
        f.write(xor('\n'.join(nwsm_lines).encode('utf-8'), XOR_KEY))
    print(f"Saved nwsm J.enc with {len(nwsm_lines)} questions")

if __name__ == "__main__":
    main()
