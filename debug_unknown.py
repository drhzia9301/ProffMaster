"""Debug unknown years"""

XOR_KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

with open('public/qbanks/kgmc J.enc', 'rb') as f:
    data = xor(f.read(), XOR_KEY).decode('utf-8')

lines = [l for l in data.strip().split('\n') if l.strip()]
unknown = [l for l in lines if "'2023'" not in l and "'2024'" not in l and "'2025'" not in l]
print(f'Unknown: {len(unknown)}')
for l in unknown[:2]:
    print(l[-120:])
    print("---")
