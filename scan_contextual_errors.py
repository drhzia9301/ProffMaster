"""Scan for contextual spelling errors (correct words but wrong in context)"""
import re
import os

XOR_KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

# Contextual errors - words that are spelled correctly but wrong in context
CONTEXTUAL_ERRORS = [
    # Medical context errors
    (r'\bthinking water\b', 'drinking water'),
    (r'\bdrinking of water\b', 'drinking water'),  # rabies hydrophobia
    (r'\bfear of thinking\b', 'fear of drinking'),
    (r'\bdifficulty in thinking water\b', 'difficulty in drinking water'),
    (r'\bdifficulty In thinking water\b', 'difficulty in drinking water'),
    (r'\bthinking difficulty\b', 'drinking difficulty'),
    (r'\bavoid thinking\b', 'avoid drinking'),
    (r'\bunable to think water\b', 'unable to drink water'),
    
    # Common OCR/typing errors in medical context
    (r'\bchronic pain\b(?=.*\bchronic pain\b)', 'DUPLICATE: chronic pain'),
    (r'\btrated\b', 'treated'),
    (r'\bpatents\b', 'patients'),
    (r'\bdisese\b', 'disease'),
    (r'\bdieases\b', 'diseases'),
    (r'\bdesease\b', 'disease'),
    (r'\bdiagnosed\b(?=.*\bdiagnosed\b)', 'DUPLICATE: diagnosed'),
    (r'\bpresented\b(?=.*\bpresented\b)', 'DUPLICATE: presented'),
    (r'\bcompaining\b', 'complaining'),
    (r'\bcomplaning\b', 'complaining'),
    (r'\bexaminaion\b', 'examination'),
    (r'\bexamintaion\b', 'examination'),
    (r'\bexamiantion\b', 'examination'),
    (r'\bmanagment\b', 'management'),
    (r'\bmanagament\b', 'management'),
    (r'\btreatmant\b', 'treatment'),
    (r'\bprescirbed\b', 'prescribed'),
    (r'\bprescibed\b', 'prescribed'),
    (r'\bprecsribed\b', 'prescribed'),
    (r'\badminstered\b', 'administered'),
    (r'\badministred\b', 'administered'),
    (r'\breccomended\b', 'recommended'),
    (r'\brecomended\b', 'recommended'),
    (r'\breccommended\b', 'recommended'),
    (r'\blabratory\b', 'laboratory'),
    (r'\blaborotary\b', 'laboratory'),
    (r'\blaboraotry\b', 'laboratory'),
    (r'\binvestiagtion\b', 'investigation'),
    (r'\binvestiation\b', 'investigation'),
    (r'\bsymtoms\b', 'symptoms'),
    (r'\bsymptomes\b', 'symptoms'),
    (r'\bsymptpms\b', 'symptoms'),
    (r'\bhistroy\b', 'history'),
    (r'\bhistory of of\b', 'history of'),
    (r'\bpresenting with with\b', 'presenting with'),
    (r'\bcomplaining of of\b', 'complaining of'),
    (r'\bdiagnosed with with\b', 'diagnosed with'),
    (r'\bsuffering from from\b', 'suffering from'),
    (r'\bpain in in\b', 'pain in'),
    (r'\btreated with with\b', 'treated with'),
    (r'\bfound to to\b', 'found to'),
    (r'\bable to to\b', 'able to'),
    (r'\bhas has\b', 'has'),
    (r'\bhad had\b', 'had'),
    (r'\bpatient patient\b', 'patient'),
    
    # Rabies specific - hydrophobia
    (r'\bfear of water\b', None),  # This is correct, just flagging for review
    (r'\bhydrophobia\b', None),  # Correct
    
    # Common transpositions
    (r'\bfomr\b', 'from'),
    (r'\bform\b(?=\s+(?:the|a|an|this|that)\s)', 'from'),  # "form the" -> "from the"
    (r'\bteh\b', 'the'),
    (r'\bwiht\b', 'with'),
    (r'\bthsi\b', 'this'),
    (r'\btaht\b', 'that'),
    (r'\bwhcih\b', 'which'),
    (r'\bwihch\b', 'which'),
]

def extract_question_text(sql_line):
    """Extract question text from SQL INSERT statement"""
    start = sql_line.find("VALUES ('") + 9
    end = sql_line.find("',", start)
    if start > 8 and end > start:
        return sql_line[start:end]
    return ""

def check_text(text, patterns):
    """Check text for contextual errors"""
    errors = []
    for pattern, correction in patterns:
        if correction is None:
            continue  # Skip patterns that are just for review
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            errors.append({
                'found': match.group(),
                'correction': correction,
                'position': match.start(),
                'context': text[max(0, match.start()-40):match.end()+40]
            })
    return errors

# Scan all files
print("=" * 80)
print("SCANNING FOR CONTEXTUAL ERRORS (correct words, wrong context)")
print("=" * 80)

all_errors = []
files = [f for f in os.listdir('public/qbanks') if f.endswith('.enc')]
files.sort()

for fname in files:
    with open(f'public/qbanks/{fname}', 'rb') as f:
        data = xor(f.read(), XOR_KEY).decode('utf-8')
    
    lines = [l for l in data.strip().split('\n') if l.strip() and l.startswith('INSERT')]
    
    for i, line in enumerate(lines):
        question = extract_question_text(line)
        
        q_errors = check_text(question, CONTEXTUAL_ERRORS)
        
        for err in q_errors:
            all_errors.append({
                'file': fname,
                'line': i + 1,
                'full_line': line,
                **err
            })

# Report
if all_errors:
    print(f"\nFound {len(all_errors)} contextual errors:\n")
    
    # Group by file
    by_file = {}
    for err in all_errors:
        fname = err['file']
        if fname not in by_file:
            by_file[fname] = []
        by_file[fname].append(err)
    
    for fname, errors in sorted(by_file.items()):
        print(f"\n{'='*60}")
        print(f"{fname} ({len(errors)} errors)")
        print('='*60)
        for err in errors:
            print(f"\n  Line {err['line']}:")
            print(f"    Found: '{err['found']}' -> Should be: '{err['correction']}'")
            print(f"    Context: ...{err['context']}...")
else:
    print("\n✓ No contextual errors found!")

print(f"\n{'='*80}")
if all_errors:
    print(f"TOTAL: {len(all_errors)} contextual errors across {len(by_file)} files")
else:
    print("TOTAL: 0 contextual errors")
print('='*80)
