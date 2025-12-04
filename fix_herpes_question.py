"""
Fix the Herpes encephalitis question typo in kmc J.enc
"""
import re

XOR_KEY = "SUPERSIX_SECURE_KEY_2025"

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

# Read
content = xor(open('public/qbanks/kmc J.enc', 'rb').read(), XOR_KEY).decode('utf-8')

# Fix the typo
old_text = "died from bernatir entenhalitit which of the following Is relevant microscopl feature"
new_text = "died from herpetic encephalitis (herpes encephalitis). Which of the following is the relevant microscopic feature"

if old_text in content:
    content = content.replace(old_text, new_text)
    print("Fixed the typo!")
else:
    print("Could not find the exact text to fix")
    # Try partial
    if "bernatir" in content:
        print("Found 'bernatir' - fixing...")
        content = content.replace("bernatir entenhalitit", "herpetic encephalitis")
        content = content.replace("microscopl", "microscopic")
        print("Applied fixes")

# Write back
with open('public/qbanks/kmc J.enc', 'wb') as f:
    f.write(xor(content.encode('utf-8'), XOR_KEY))

print("Saved!")

# Verify
content2 = xor(open('public/qbanks/kmc J.enc', 'rb').read(), XOR_KEY).decode()
if "herpetic encephalitis" in content2:
    print("Verified: fix applied successfully")
