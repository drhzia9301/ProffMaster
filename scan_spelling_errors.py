"""Scan all encrypted preproff files for ACTUAL spelling errors only"""
import re
import os

XOR_KEY = 'SUPERSIX_SECURE_KEY_2025'

def xor(data, key):
    k = key.encode()
    return bytes([b ^ k[i % len(k)] for i, b in enumerate(data)])

# Only actual misspellings - wrong -> correct
SPELLING_ERRORS = [
    # Common typos
    (r'\bteh\b', 'the'),
    (r'\bpatinet\b', 'patient'),
    (r'\bdiagnois\b', 'diagnosis'),
    (r'\btreatmnet\b', 'treatment'),
    (r'\bwich\b', 'which'),
    
    # Medical terms commonly misspelled
    (r'\bpnuemonia\b', 'pneumonia'),
    (r'\bpneumonai\b', 'pneumonia'),
    (r'\btuberoclosis\b', 'tuberculosis'),
    (r'\btuberculois\b', 'tuberculosis'),
    (r'\bdiabtes\b', 'diabetes'),
    (r'\bdiabetis\b', 'diabetes'),
    (r'\bhypertesion\b', 'hypertension'),
    (r'\bhypertenison\b', 'hypertension'),
    (r'\bcarcinomoa\b', 'carcinoma'),
    (r'\bcaricnoma\b', 'carcinoma'),
    (r'\bmeningtis\b', 'meningitis'),
    (r'\bmeningits\b', 'meningitis'),
    (r'\bencephalits\b', 'encephalitis'),
    (r'\bencepahlitis\b', 'encephalitis'),
    (r'\bentenhalitit\b', 'encephalitis'),
    (r'\bbernatir\b', 'herpetic'),
    (r'\bmicroscopl\b', 'microscopic'),
    (r'\bhepatits\b', 'hepatitis'),
    (r'\bhepattis\b', 'hepatitis'),
    (r'\bnephrtis\b', 'nephritis'),
    (r'\bnephrits\b', 'nephritis'),
    (r'\barthrits\b', 'arthritis'),
    (r'\barthirits\b', 'arthritis'),
    (r'\bdermatits\b', 'dermatitis'),
    (r'\bdermattis\b', 'dermatitis'),
    (r'\bgastrtis\b', 'gastritis'),
    (r'\bgastrits\b', 'gastritis'),
    (r'\bcolits\b', 'colitis'),
    (r'\bcoltis\b', 'colitis'),
    (r'\bpancreatits\b', 'pancreatitis'),
    (r'\bpancretitis\b', 'pancreatitis'),
    (r'\bappendicits\b', 'appendicitis'),
    (r'\bappendictis\b', 'appendicitis'),
    (r'\bcholecystits\b', 'cholecystitis'),
    (r'\bcholecystis\b', 'cholecystitis'),
    (r'\bosteomyelits\b', 'osteomyelitis'),
    (r'\bosteomyeltis\b', 'osteomyelitis'),
    (r'\bendocardits\b', 'endocarditis'),
    (r'\bendocardtis\b', 'endocarditis'),
    (r'\bmyocardits\b', 'myocarditis'),
    (r'\bmyocardtis\b', 'myocarditis'),
    (r'\bpericardits\b', 'pericarditis'),
    (r'\bpericaridtis\b', 'pericarditis'),
    (r'\bleukamia\b', 'leukemia'),
    (r'\blymphomoa\b', 'lymphoma'),
    (r'\bsarcmoa\b', 'sarcoma'),
    (r'\bmelanmoa\b', 'melanoma'),
    (r'\bglaucmoa\b', 'glaucoma'),
    (r'\bcatarcat\b', 'cataract'),
    (r'\bcataratc\b', 'cataract'),
    (r'\bretinopahty\b', 'retinopathy'),
    (r'\bretinopthy\b', 'retinopathy'),
    (r'\bneuropahty\b', 'neuropathy'),
    (r'\bneuropthy\b', 'neuropathy'),
    (r'\bmyopahty\b', 'myopathy'),
    (r'\bmyopthy\b', 'myopathy'),
    (r'\bcardiomyopahty\b', 'cardiomyopathy'),
    (r'\bcardiomyopthy\b', 'cardiomyopathy'),
    (r'\bencephalopahty\b', 'encephalopathy'),
    (r'\bencephalopthy\b', 'encephalopathy'),
    (r'\bnephropahty\b', 'nephropathy'),
    (r'\bnephropthy\b', 'nephropathy'),
    (r'\bhemorrhaghe\b', 'hemorrhage'),
    (r'\bhemmorhage\b', 'hemorrhage'),
    (r'\bhaemorrahge\b', 'hemorrhage'),
    (r'\bthrombossi\b', 'thrombosis'),
    (r'\bthromobsis\b', 'thrombosis'),
    (r'\bembolsim\b', 'embolism'),
    (r'\bemblosim\b', 'embolism'),
    (r'\binfarciton\b', 'infarction'),
    (r'\binfarcton\b', 'infarction'),
    (r'\bcirrhossi\b', 'cirrhosis'),
    (r'\bcirrohsis\b', 'cirrhosis'),
    (r'\bnecorsis\b', 'necrosis'),
    (r'\bnecrosi\b', 'necrosis'),
    (r'\bapoptossi\b', 'apoptosis'),
    (r'\bmetastasi\b', 'metastasis'),
    (r'\bmetastsis\b', 'metastasis'),
    (r'\bprognossi\b', 'prognosis'),
    (r'\bprognsois\b', 'prognosis'),
    (r'\bdiagnossi\b', 'diagnosis'),
    (r'\bdiagnsis\b', 'diagnosis'),
    (r'\bpathogenssi\b', 'pathogenesis'),
    (r'\bpathogensi\b', 'pathogenesis'),
    (r'\betioloogy\b', 'etiology'),
    (r'\betiolgoy\b', 'etiology'),
    (r'\bepidemiolgoy\b', 'epidemiology'),
    (r'\bepidemiolgy\b', 'epidemiology'),
    (r'\bphysiolgoy\b', 'physiology'),
    (r'\bphysiolgy\b', 'physiology'),
    (r'\banatomoy\b', 'anatomy'),
    (r'\banatmoy\b', 'anatomy'),
    (r'\bhistolgoy\b', 'histology'),
    (r'\bhistolgy\b', 'histology'),
    (r'\bpatholgoy\b', 'pathology'),
    (r'\bpatholgy\b', 'pathology'),
    (r'\bpharmacolgoy\b', 'pharmacology'),
    (r'\bpharmcolgy\b', 'pharmacology'),
    (r'\bmicrobiolgoy\b', 'microbiology'),
    (r'\bmicrobolgy\b', 'microbiology'),
    (r'\bbiochemsitry\b', 'biochemistry'),
    (r'\bimmunolgoy\b', 'immunology'),
    (r'\bimmunolgy\b', 'immunology'),
    
    # Drug name typos
    (r'\bmetformni\b', 'metformin'),
    (r'\bmetfrmin\b', 'metformin'),
    (r'\binsluin\b', 'insulin'),
    (r'\binsulni\b', 'insulin'),
    (r'\basprin\b', 'aspirin'),
    (r'\basiprin\b', 'aspirin'),
    (r'\bparacetamlo\b', 'paracetamol'),
    (r'\bparacetmol\b', 'paracetamol'),
    (r'\bamoxicilln\b', 'amoxicillin'),
    (r'\bamoxicilin\b', 'amoxicillin'),
    (r'\bpenicilln\b', 'penicillin'),
    (r'\bpeniclin\b', 'penicillin'),
    (r'\bciprofloxacni\b', 'ciprofloxacin'),
    (r'\bciprofloxcin\b', 'ciprofloxacin'),
    (r'\bmetronidazoel\b', 'metronidazole'),
    (r'\bmetronidazle\b', 'metronidazole'),
    (r'\bomeprazoel\b', 'omeprazole'),
    (r'\bomeprazle\b', 'omeprazole'),
    (r'\batorvastatni\b', 'atorvastatin'),
    (r'\batorvastain\b', 'atorvastatin'),
    (r'\blosartna\b', 'losartan'),
    (r'\blosartn\b', 'losartan'),
    (r'\bamlodipin\b', 'amlodipine'),
    (r'\bamlodipne\b', 'amlodipine'),
    (r'\bfurosemied\b', 'furosemide'),
    (r'\bfurosemde\b', 'furosemide'),
    (r'\bprednisolon\b', 'prednisolone'),
    (r'\bprednisolne\b', 'prednisolone'),
    (r'\bdexamethason\b', 'dexamethasone'),
    (r'\bdexamethsone\b', 'dexamethasone'),
    (r'\bhydrocortison\b', 'hydrocortisone'),
    (r'\bhydrocortisne\b', 'hydrocortisone'),
    (r'\bwarfrin\b', 'warfarin'),
    (r'\bhepairn\b', 'heparin'),
    (r'\bheprain\b', 'heparin'),
    (r'\benoxapairn\b', 'enoxaparin'),
    (r'\benoxaprin\b', 'enoxaparin'),
    
    # Anatomical typos
    (r'\bpharynyx\b', 'pharynx'),
    (r'\blarynyx\b', 'larynx'),
    (r'\btrachae\b', 'trachea'),
    (r'\besophagsu\b', 'esophagus'),
    (r'\bstomahc\b', 'stomach'),
    (r'\bstomch\b', 'stomach'),
    (r'\bintestnie\b', 'intestine'),
    (r'\bintestne\b', 'intestine'),
    (r'\bpancraes\b', 'pancreas'),
    (r'\bpancres\b', 'pancreas'),
    (r'\blievr\b', 'liver'),
    (r'\blivr\b', 'liver'),
    (r'\bkideny\b', 'kidney'),
    (r'\bkidny\b', 'kidney'),
    (r'\bbladdr\b', 'bladder'),
    (r'\bblader\b', 'bladder'),
    (r'\buretehr\b', 'ureter'),
    (r'\buretr\b', 'ureter'),
    (r'\burethrae\b', 'urethra'),
    (r'\bprostat\b', 'prostate'),
    (r'\bprostae\b', 'prostate'),
    (r'\bovarie\b', 'ovary'),
    (r'\bovay\b', 'ovary'),
    (r'\bcervxi\b', 'cervix'),
    (r'\bcervx\b', 'cervix'),
    (r'\bvagnia\b', 'vagina'),
    (r'\btestsi\b', 'testis'),
    (r'\bepidydimis\b', 'epididymis'),
    (r'\bepididyms\b', 'epididymis'),
    (r'\bsemianl\b', 'seminal'),
    (r'\bsemnal\b', 'seminal'),
    
    # Gibberish/OCR errors - long strings of consonants only
    (r'\b[bcdfghjklmnpqrstvwxz]{7,}\b', 'POSSIBLE_GIBBERISH'),
    
    # Obvious doubled words
    (r'\bthe the\b', 'the'),
    (r'\ba a\b', 'a'),
    (r'\ban an\b', 'an'),
    (r'\bis is\b', 'is'),
    (r'\bwas was\b', 'was'),
    (r'\bare are\b', 'are'),
    (r'\bwere were\b', 'were'),
    (r'\bto to\b', 'to'),
    (r'\bof of\b', 'of'),
    (r'\bin in\b', 'in'),
    (r'\bon on\b', 'on'),
    (r'\band and\b', 'and'),
    (r'\bor or\b', 'or'),
    (r'\bfor for\b', 'for'),
    (r'\bwith with\b', 'with'),
    (r'\bthat that\b', 'that'),
    (r'\bthis this\b', 'this'),
    (r'\bwhich which\b', 'which'),
    (r'\bwhat what\b', 'what'),
]

def extract_question_text(sql_line):
    """Extract question text from SQL INSERT statement"""
    start = sql_line.find("VALUES ('") + 9
    end = sql_line.find("',", start)
    if start > 8 and end > start:
        return sql_line[start:end]
    return ""

def check_text(text, patterns):
    """Check text for spelling errors"""
    errors = []
    for pattern, correction in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            errors.append({
                'found': match.group(),
                'correction': correction,
                'position': match.start(),
                'context': text[max(0, match.start()-30):match.end()+30]
            })
    return errors

# Scan all files
print("=" * 80)
print("SCANNING FOR SPELLING ERRORS (Misspellings Only)")
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
        
        q_errors = check_text(question, SPELLING_ERRORS)
        
        for err in q_errors:
            all_errors.append({
                'file': fname,
                'line': i + 1,
                'type': 'question',
                **err
            })

# Report
if all_errors:
    print(f"\nFound {len(all_errors)} spelling errors:\n")
    
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
    print("\n✓ No spelling errors found! All files are clean.")

print(f"\n{'='*80}")
if all_errors:
    print(f"TOTAL: {len(all_errors)} spelling errors across {len(by_file)} files")
else:
    print("TOTAL: 0 spelling errors - All files are clean!")
print('='*80)
