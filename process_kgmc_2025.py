import json
import os

def xor_encrypt_decrypt(data, key):
    """Encrypts or decrypts data using XOR with the given key."""
    key_bytes = key.encode('utf-8')
    key_len = len(key_bytes)
    result = bytearray(len(data))
    
    for i in range(len(data)):
        result[i] = data[i] ^ key_bytes[i % key_len]
        
    return result

def answer_to_index(answer):
    """Convert answer letter to index (a->0, b->1, etc.)"""
    answer = answer.strip().lower()
    if answer.startswith('a'):
        return 0
    elif answer.startswith('b'):
        return 1
    elif answer.startswith('c'):
        return 2
    elif answer.startswith('d'):
        return 3
    elif answer.startswith('e'):
        return 4
    return 0

def clean_option(opt):
    """Clean option text - remove leading letter like 'a. ' or 'a) '"""
    opt = opt.strip()
    if len(opt) > 2 and opt[0].lower() in 'abcde' and opt[1] in '.):':
        opt = opt[2:].strip()
    elif len(opt) > 3 and opt[0].lower() in 'abcde' and opt[1] == ')':
        opt = opt[2:].strip()
    return opt

def escape_sql_string(s):
    """Escape single quotes for SQL"""
    return s.replace("'", "''")

def json_to_sql_inserts(json_data, block_name, college, year):
    """Convert JSON questions to SQL INSERT statements"""
    inserts = []
    
    for q in json_data:
        text = escape_sql_string(q['question'])
        
        # Clean and format options
        options = [clean_option(opt) for opt in q['options']]
        options_json = json.dumps(options)
        options_escaped = escape_sql_string(options_json)
        
        correct_index = answer_to_index(q['answer'])
        explanation = escape_sql_string(q.get('explanation', ''))
        
        # Format: INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES (...)
        sql = f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{text}', '{options_escaped}', {correct_index}, '{explanation}', '', '', '', '{block_name}', '{college}', '{year}');"
        inserts.append(sql)
    
    return inserts

def main():
    key = "SUPERSIX_SECURE_KEY_2025"
    
    # Mapping of input files to block names
    files_mapping = {
        'lkgmc2025.txt': ('Block L', 'kgmc L.enc'),
        'm1kgmc2025.txt': ('Block M1', 'kgmc M1.enc'),
        'm2kgmc2025.txt': ('Block M2', 'kgmc M2.enc'),
    }
    
    input_dir = os.path.join('2023_preproffs', '2024-25', 'kgmc2025')
    output_dir = os.path.join('public', 'qbanks')
    
    for input_file, (block_name, enc_file) in files_mapping.items():
        input_path = os.path.join(input_dir, input_file)
        output_path = os.path.join(output_dir, enc_file)
        
        print(f"\nProcessing {input_file} -> {enc_file}")
        
        # Read the JSON file
        try:
            with open(input_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
            print(f"  Loaded {len(json_data)} questions from JSON")
        except Exception as e:
            print(f"  Error loading JSON: {e}")
            continue
        
        # Generate 2025 SQL inserts
        new_inserts = json_to_sql_inserts(json_data, block_name, 'KGMC', '2025')
        print(f"  Generated {len(new_inserts)} SQL INSERT statements for 2025")
        
        # Read existing .enc file and decrypt it
        existing_sql = ""
        if os.path.exists(output_path):
            try:
                with open(output_path, 'rb') as f:
                    encrypted_data = f.read()
                decrypted = xor_encrypt_decrypt(encrypted_data, key)
                existing_sql = decrypted.decode('utf-8')
                
                # Count existing 2023 questions
                count_2023 = existing_sql.count("'2023')")
                count_2024 = existing_sql.count("'2024')")
                count_2025 = existing_sql.count("'2025')")
                print(f"  Existing file has ~{count_2023} 2023, ~{count_2024} 2024, ~{count_2025} 2025 questions")
            except Exception as e:
                print(f"  Error reading existing file: {e}")
        
        # Combine existing and new SQL
        combined_sql = existing_sql
        if combined_sql and not combined_sql.endswith('\n'):
            combined_sql += '\n'
        combined_sql += '\n'.join(new_inserts)
        
        # Encrypt and save
        encrypted = xor_encrypt_decrypt(combined_sql.encode('utf-8'), key)
        with open(output_path, 'wb') as f:
            f.write(encrypted)
        
        # Verify
        with open(output_path, 'rb') as f:
            verify_encrypted = f.read()
        verify_decrypted = xor_encrypt_decrypt(verify_encrypted, key).decode('utf-8')
        final_2025_count = verify_decrypted.count("'2025')")
        final_total = verify_decrypted.count("INSERT INTO preproff")
        
        print(f"  Final file: {final_total} total questions, {final_2025_count} from 2025")
        print(f"  Saved to {output_path}")

if __name__ == "__main__":
    main()
