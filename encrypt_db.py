import os

def xor_encrypt_decrypt(data, key):
    """Encrypts or decrypts data using XOR with the given key."""
    key_bytes = key.encode('utf-8')
    key_len = len(key_bytes)
    result = bytearray(len(data))
    
    for i in range(len(data)):
        result[i] = data[i] ^ key_bytes[i % key_len]
        
    return result

def main():
    # Configuration
    input_file = os.path.join('public', 'assets', 'initial_db.sql')
    output_file = os.path.join('public', 'assets', 'initial_db.enc')
    key = "SUPERSIX_SECURE_KEY_2025"
    
    print(f"Encrypting {input_file}...")
    
    try:
        if not os.path.exists(input_file):
            print(f"Error: Input file {input_file} not found!")
            return
            
        with open(input_file, 'rb') as f:
            data = f.read()
            
        encrypted_data = xor_encrypt_decrypt(data, key)
        
        with open(output_file, 'wb') as f:
            f.write(encrypted_data)
            
        print(f"Success! Encrypted file saved to {output_file}")
        print(f"Original size: {len(data)} bytes")
        print(f"Encrypted size: {len(encrypted_data)} bytes")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
