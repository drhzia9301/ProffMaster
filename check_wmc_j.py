"""Check and fix WMC J year issues"""
import re

XOR_KEY = "SUPERSIX_SECURE_KEY_2025"

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

# Read wmc J.enc
content = xor(open('public/qbanks/wmc J.enc', 'rb').read(), XOR_KEY).decode()
lines = [l for l in content.split('\n') if l.strip() and 'INSERT' in l]

print(f"Total WMC J questions: {len(lines)}")

# Count by year
y2023 = [l for l in lines if "'2023'" in l]
y2024 = [l for l in lines if "'2024'" in l]
y2025 = [l for l in lines if "'2025'" in l]

print(f"2023: {len(y2023)}")
print(f"2024: {len(y2024)}")
print(f"2025: {len(y2025)}")

if y2024:
    print("\nSample 2024 entry (end):")
    print("..." + y2024[0][-100:])
