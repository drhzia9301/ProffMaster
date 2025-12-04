#!/usr/bin/env python3
"""
Final summary of preproff questions.
"""

import os
from pathlib import Path
from collections import defaultdict
import re

ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025"
QBANKS_DIR = r"c:\Users\haroo\Desktop\ProffMaster\public\qbanks"

def xor_decrypt(data: bytes, key: str) -> str:
    key_bytes = key.encode('utf-8')
    decrypted = bytes([data[i] ^ key_bytes[i % len(key_bytes)] for i in range(len(data))])
    return decrypted.decode('utf-8')

def extract_year(line: str) -> str:
    pattern = r",\s*'(\d{4})'\s*\)\s*;?\s*$"
    match = re.search(pattern, line)
    return match.group(1) if match else "unknown"

def main():
    print("="*70)
    print("PREPROFF QUESTIONS SUMMARY")
    print("="*70)
    
    # Collect stats
    by_block = defaultdict(int)
    by_year = defaultdict(int)
    by_college = defaultdict(int)
    by_block_year = defaultdict(lambda: defaultdict(int))
    by_block_college_year = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    
    files = list(Path(QBANKS_DIR).glob('*.enc'))
    
    print(f"\nTotal encrypted files: {len(files)}\n")
    print("-"*70)
    
    for filepath in sorted(files):
        filename = filepath.name
        # Parse filename: "college block.enc" e.g., "wmc J.enc"
        parts = filename.replace('.enc', '').split(' ')
        college = parts[0].upper()
        block = parts[1] if len(parts) > 1 else 'unknown'
        
        with open(filepath, 'rb') as f:
            encrypted_data = f.read()
        
        content = xor_decrypt(encrypted_data, ENCRYPTION_KEY)
        
        # Count by year
        year_counts = defaultdict(int)
        for line in content.split('\n'):
            if 'INSERT INTO preproff' in line:
                year = extract_year(line)
                year_counts[year] += 1
                by_year[year] += 1
                by_block[block] += 1
                by_college[college] += 1
                by_block_year[block][year] += 1
                by_block_college_year[block][college][year] += 1
        
        total = sum(year_counts.values())
        years_str = ", ".join(f"{y}: {c}" for y, c in sorted(year_counts.items()))
        print(f"{filename:20} | Total: {total:4} | {years_str}")
    
    print("-"*70)
    print(f"\n{'TOTALS BY BLOCK':^70}")
    print("-"*70)
    for block in sorted(by_block.keys()):
        print(f"  Block {block:4}: {by_block[block]:5} questions")
    
    print(f"\n{'TOTALS BY YEAR':^70}")
    print("-"*70)
    for year in sorted(by_year.keys()):
        print(f"  {year}: {by_year[year]:5} questions")
    
    print(f"\n{'TOTALS BY COLLEGE':^70}")
    print("-"*70)
    for college in sorted(by_college.keys()):
        print(f"  {college:5}: {by_college[college]:5} questions")
    
    print(f"\n{'DETAILED BREAKDOWN':^70}")
    print("="*70)
    
    for block in sorted(by_block_college_year.keys()):
        print(f"\n  Block {block}:")
        for college in sorted(by_block_college_year[block].keys()):
            years = by_block_college_year[block][college]
            years_str = ", ".join(f"{y}: {c}" for y, c in sorted(years.items()))
            print(f"    {college}: {years_str}")
    
    print("\n" + "="*70)
    total = sum(by_year.values())
    print(f"\n  GRAND TOTAL: {total} questions")
    print("\n" + "="*70)

if __name__ == '__main__':
    main()
