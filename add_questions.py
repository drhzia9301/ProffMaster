import os
import json
import re

def xor_encrypt_decrypt(data, key):
    """Encrypts or decrypts data using XOR with the given key."""
    key_bytes = key.encode('utf-8')
    key_len = len(key_bytes)
    result = bytearray(len(data))
    for i in range(len(data)):
        result[i] = data[i] ^ key_bytes[i % key_len]
    return result

def create_sql_insert(question, options, correct_index, explanation, block, college, year):
    """Create SQL INSERT statement."""
    q = question.replace("'", "''")
    exp = explanation.replace("'", "''")
    opts_json = json.dumps(options).replace("'", "''")
    return f"INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('{q}', '{opts_json}', {correct_index}, '{exp}', '', '', 'Medium', '{block}', '{college}', '{year}');"

key = "SUPERSIX_SECURE_KEY_2025"
output_dir = "public/qbanks"

# 5 questions to copy from WMC to KGMC (selected good questions)
wmc_questions_to_copy = [
    {
        "question": "A 14 years old male is found to have multiple almost 120 colonic polyps and few almost 3 stomach polyps on colonoscopy and endoscopy respectively. His grandfather died of colonic adenocarcinoma. He has also some vision problem. What syndrome he is likely suffering from?",
        "options": ["Juvenile polyposis", "Peutz-Jeghers polyposis", "Hereditary non polyposis colorectal cancer/HNPCC", "Familial adenomatous polyposis/FAP", "Irritable bowel syndrome"],
        "correct_index": 3,
        "explanation": "Familial Adenomatous Polyposis (FAP) is characterized by the presence of hundreds (>100) of adenomatous polyps in the colon. Congenital Hypertrophy of the Retinal Pigment Epithelium (CHRPE) is a specific extra-intestinal manifestation (vision problem) associated with FAP."
    },
    {
        "question": "A 65 years old female presents with complaint of blood and mucus in stools with on and off diarrhea. Endoscopy of small bowel reveal skip lesions with sharply demarcated deep ulcers surrounded by normal looking mucosa. Microscopy reveals transmural inflammation with epithelioid granulomas along with crypt abscess and distortion. These are the characteristics findings of?",
        "options": ["Crohn's disease", "Ulcerative colitis", "Celiac disease", "Tropical sprue", "Microscopic colitis"],
        "correct_index": 0,
        "explanation": "Crohn's disease is characterized by skip lesions, deep 'knife-like' ulcers, transmural inflammation, and the presence of non-caseating epithelioid granulomas."
    },
    {
        "question": "A 54 year old man with a long history of indigestion after meal and heart burn presents with upper abdominal pain. He was treated with proton pump inhibitors for gastroesophageal reflux years previously. An endoscopic biopsy of the lower esophagus shows glandular metaplasia. He is at increased risk of developing which of the following disease of the esophagus?",
        "options": ["Achalasia", "Adenocarcinoma", "Candidiasis", "Plummer Vinson syndrome", "Varices"],
        "correct_index": 1,
        "explanation": "The finding of glandular metaplasia in the lower esophagus defines Barrett's Esophagus, which is the primary precursor lesion for Esophageal Adenocarcinoma."
    },
    {
        "question": "A 30 years old male presents with dementia, hemiballismus and deranged liver enzymes. On further evaluation its abdominal ultrasound shows cirrhosis of liver. His viral serology is negative. What is the most likely next finding in this patient?",
        "options": ["Periodic acid schiff stain shows red cytoplasmic granules in hepatocytes", "Kayser-Fleischer rings in cornea", "Highly increased alpha feto proteins", "Anti mitochondrial antibodies in blood", "Central cyanosis"],
        "correct_index": 1,
        "explanation": "Wilson's disease involves copper accumulation leading to liver cirrhosis and neurological/psychiatric symptoms (dementia, movement disorders) in young adults. Kayser-Fleischer rings in the cornea are a diagnostic sign."
    },
    {
        "question": "A 65 years old woman dies of metastatic liver at autopsy shows a multinodular vascular tumor that histologically is composed of anastomosing channels lined by anaplastic endothelial cells. The Liver parenchyma between tumor nodules appears normal. The histopathologist gives a preliminary diagnosis of angiosarcoma of the liver. Which of the following risk factors is associated with this form of liver cancer?",
        "options": ["Cirrhosis", "Hemochromatosis", "Exposure of vinyl chloride", "Hepatitis B viral infection", "Oral contraceptive use"],
        "correct_index": 2,
        "explanation": "Angiosarcoma of the liver is a rare malignant tumor associated with chemical exposures, specifically Vinyl Chloride, Arsenic, and Thorotrast."
    }
]

# 20 new questions for KGMC (Block K syllabus topics)
new_kgmc_questions = [
    {
        "question": "A 45-year-old male presents with progressive dysphagia to solids for 6 months and weight loss. Barium swallow shows irregular stricture in the lower third of esophagus. What is the most likely diagnosis?",
        "options": ["Esophageal adenocarcinoma", "Achalasia", "Esophageal web", "GERD", "Diffuse esophageal spasm"],
        "correct_index": 0,
        "explanation": "Progressive dysphagia to solids with weight loss and irregular stricture in the lower esophagus is highly suggestive of esophageal adenocarcinoma, especially with Barrett's esophagus risk."
    },
    {
        "question": "Which hepatitis virus has the highest mortality rate in pregnant women?",
        "options": ["Hepatitis A", "Hepatitis B", "Hepatitis C", "Hepatitis D", "Hepatitis E"],
        "correct_index": 4,
        "explanation": "Hepatitis E has a mortality rate of 15-25% in pregnant women, particularly in the third trimester, making it the most dangerous hepatitis virus during pregnancy."
    },
    {
        "question": "A patient with liver cirrhosis develops asterixis, confusion, and fetor hepaticus. Which drug should be given to reduce ammonia levels?",
        "options": ["Omeprazole", "Metoclopramide", "Lactulose", "Ondansetron", "Sucralfate"],
        "correct_index": 2,
        "explanation": "Lactulose is used in hepatic encephalopathy to reduce ammonia absorption. It acidifies colonic contents, converting ammonia to ammonium which is not absorbed."
    },
    {
        "question": "A 35-year-old female presents with painless jaundice, pruritus, and positive Anti-Mitochondrial Antibodies (AMA). Which condition is most likely?",
        "options": ["Autoimmune hepatitis", "Primary biliary cholangitis", "Primary sclerosing cholangitis", "Wilson disease", "Hemochromatosis"],
        "correct_index": 1,
        "explanation": "Primary Biliary Cholangitis (PBC) classically presents in middle-aged women with pruritus, cholestatic jaundice, and is strongly associated with positive Anti-Mitochondrial Antibodies (AMA)."
    },
    {
        "question": "Which of the following is the most common site of colorectal carcinoma metastasis?",
        "options": ["Lungs", "Liver", "Brain", "Bone", "Adrenal glands"],
        "correct_index": 1,
        "explanation": "The liver is the most common site of colorectal carcinoma metastasis due to portal venous drainage from the colon directly to the liver."
    },
    {
        "question": "A patient presents with severe epigastric pain radiating to the back, elevated serum amylase and lipase. Which is the most common cause of acute pancreatitis?",
        "options": ["Alcohol", "Gallstones", "Hyperlipidemia", "Trauma", "Medications"],
        "correct_index": 1,
        "explanation": "Gallstones are the most common cause of acute pancreatitis (40-70% of cases), followed by alcohol consumption. The mnemonic 'I GET SMASHED' helps remember causes."
    },
    {
        "question": "What is the mechanism of action of Omeprazole?",
        "options": ["H2 receptor blockade", "Proton pump inhibition", "Prostaglandin analog", "Antacid neutralization", "Muscarinic receptor blockade"],
        "correct_index": 1,
        "explanation": "Omeprazole is a proton pump inhibitor (PPI) that irreversibly inhibits the H+/K+ ATPase pump in gastric parietal cells, reducing acid secretion."
    },
    {
        "question": "A 40-year-old chronic alcoholic presents with hematemesis. On examination, he has ascites and splenomegaly. The most likely source of bleeding is:",
        "options": ["Gastric ulcer", "Esophageal varices", "Mallory-Weiss tear", "Gastric carcinoma", "Duodenal ulcer"],
        "correct_index": 1,
        "explanation": "In a chronic alcoholic with signs of portal hypertension (ascites, splenomegaly), esophageal varices are the most likely cause of upper GI bleeding."
    },
    {
        "question": "Which serological marker is most specific for hepatocellular carcinoma?",
        "options": ["CEA", "CA 19-9", "Alpha-fetoprotein (AFP)", "CA 125", "PSA"],
        "correct_index": 2,
        "explanation": "Alpha-fetoprotein (AFP) is the most commonly used tumor marker for hepatocellular carcinoma, though it can also be elevated in testicular tumors and pregnancy."
    },
    {
        "question": "A patient with chronic constipation is prescribed Bisacodyl. What is its mechanism of action?",
        "options": ["Bulk-forming agent", "Osmotic laxative", "Stimulant laxative", "Stool softener", "Lubricant laxative"],
        "correct_index": 2,
        "explanation": "Bisacodyl is a stimulant laxative that acts by stimulating peristalsis through direct action on the intestinal mucosa and myenteric plexus."
    },
    {
        "question": "Which of the following is NOT a feature of Ulcerative Colitis?",
        "options": ["Continuous mucosal involvement", "Crypt abscesses", "Skip lesions", "Pseudopolyps", "Rectal involvement"],
        "correct_index": 2,
        "explanation": "Skip lesions are characteristic of Crohn's disease, not Ulcerative Colitis. UC shows continuous mucosal inflammation starting from the rectum."
    },
    {
        "question": "A 60-year-old male presents with painless jaundice and a palpable gallbladder. According to Courvoisier's law, what is the most likely diagnosis?",
        "options": ["Cholelithiasis", "Acute cholecystitis", "Carcinoma head of pancreas", "Chronic cholecystitis", "Hepatitis"],
        "correct_index": 2,
        "explanation": "Courvoisier's law states that a palpable, non-tender gallbladder with painless jaundice suggests malignant obstruction (usually carcinoma head of pancreas) rather than gallstones."
    },
    {
        "question": "What is the characteristic histological finding in Whipple disease?",
        "options": ["Crypt abscesses", "Granulomas", "PAS-positive macrophages", "Reed-Sternberg cells", "Signet ring cells"],
        "correct_index": 2,
        "explanation": "Whipple disease is characterized by PAS-positive macrophages in the intestinal lamina propria containing the causative organism Tropheryma whipplei."
    },
    {
        "question": "A patient with H. pylori infection is started on triple therapy. Which antibiotic combination is used with PPI?",
        "options": ["Amoxicillin + Metronidazole", "Clarithromycin + Amoxicillin", "Ciprofloxacin + Tetracycline", "Erythromycin + Gentamicin", "Vancomycin + Rifampicin"],
        "correct_index": 1,
        "explanation": "Standard triple therapy for H. pylori consists of a PPI + Clarithromycin + Amoxicillin for 14 days. Metronidazole can substitute for amoxicillin in penicillin-allergic patients."
    },
    {
        "question": "Which drug is used as an antidote in paracetamol poisoning?",
        "options": ["Flumazenil", "Naloxone", "N-acetylcysteine", "Atropine", "Pralidoxime"],
        "correct_index": 2,
        "explanation": "N-acetylcysteine (NAC) is the antidote for paracetamol poisoning. It replenishes glutathione stores and enhances sulfation pathway of paracetamol metabolism."
    },
    {
        "question": "What is the triad of symptoms in Charcot's cholangitis?",
        "options": ["Fever, jaundice, right upper quadrant pain", "Fever, altered consciousness, hypotension", "Jaundice, ascites, encephalopathy", "Abdominal pain, vomiting, constipation", "Hematemesis, melena, hematochezia"],
        "correct_index": 0,
        "explanation": "Charcot's triad consists of fever with rigors, jaundice, and right upper quadrant pain, indicating acute ascending cholangitis."
    },
    {
        "question": "A 50-year-old male with chronic Hepatitis C develops new onset ascites. His AFP is markedly elevated. What is the most likely complication?",
        "options": ["Spontaneous bacterial peritonitis", "Hepatorenal syndrome", "Hepatocellular carcinoma", "Portal vein thrombosis", "Hepatic encephalopathy"],
        "correct_index": 2,
        "explanation": "In a patient with chronic HCV and cirrhosis, markedly elevated AFP with new symptoms strongly suggests hepatocellular carcinoma."
    },
    {
        "question": "Which of the following drugs is contraindicated in pregnancy due to teratogenic effects?",
        "options": ["Omeprazole", "Ranitidine", "Misoprostol", "Sucralfate", "Antacids"],
        "correct_index": 2,
        "explanation": "Misoprostol is contraindicated in pregnancy as it causes uterine contractions and can lead to abortion. It's a prostaglandin E1 analog used for peptic ulcer prevention."
    },
    {
        "question": "A child presents with rice-water stools, severe dehydration, and hypotension. The most likely causative organism is:",
        "options": ["Salmonella typhi", "Shigella", "Vibrio cholerae", "E. coli", "Rotavirus"],
        "correct_index": 2,
        "explanation": "Rice-water stools with severe dehydration are characteristic of cholera caused by Vibrio cholerae, which produces an enterotoxin affecting intestinal chloride channels."
    },
    {
        "question": "What is the most common type of esophageal cancer worldwide?",
        "options": ["Adenocarcinoma", "Squamous cell carcinoma", "Small cell carcinoma", "Leiomyosarcoma", "Lymphoma"],
        "correct_index": 1,
        "explanation": "Squamous cell carcinoma is the most common type of esophageal cancer worldwide, though adenocarcinoma is more common in Western countries."
    }
]

# 10 new questions for KMC
new_kmc_questions = [
    {
        "question": "Which enzyme is elevated earliest in acute pancreatitis?",
        "options": ["Lipase", "Amylase", "Trypsin", "Elastase", "Phospholipase"],
        "correct_index": 1,
        "explanation": "Serum amylase rises within 6-12 hours of acute pancreatitis onset, while lipase rises slightly later but remains elevated longer and is more specific."
    },
    {
        "question": "A 55-year-old patient with hepatitis B develops ascites. Serum-ascites albumin gradient (SAAG) is 1.5 g/dL. This indicates:",
        "options": ["Tuberculous peritonitis", "Portal hypertension", "Nephrotic syndrome", "Pancreatic ascites", "Malignant ascites"],
        "correct_index": 1,
        "explanation": "SAAG ≥1.1 g/dL indicates portal hypertension as the cause of ascites. Causes include cirrhosis, heart failure, and Budd-Chiari syndrome."
    },
    {
        "question": "Which prokinetic drug can cause extrapyramidal side effects?",
        "options": ["Domperidone", "Metoclopramide", "Erythromycin", "Mosapride", "Itopride"],
        "correct_index": 1,
        "explanation": "Metoclopramide crosses the blood-brain barrier and can cause extrapyramidal symptoms due to dopamine receptor blockade in the basal ganglia."
    },
    {
        "question": "A patient with inflammatory bowel disease is started on Mesalamine. What is its mechanism of action?",
        "options": ["TNF-alpha inhibition", "Topical anti-inflammatory via 5-ASA", "Immunosuppression", "Proton pump inhibition", "Antibiotic action"],
        "correct_index": 1,
        "explanation": "Mesalamine (5-aminosalicylic acid) acts locally on the intestinal mucosa to reduce inflammation through inhibition of prostaglandin and leukotriene synthesis."
    },
    {
        "question": "What is the gold standard investigation for diagnosing achalasia?",
        "options": ["Barium swallow", "Upper GI endoscopy", "Esophageal manometry", "CT scan", "24-hour pH monitoring"],
        "correct_index": 2,
        "explanation": "Esophageal manometry is the gold standard for diagnosing achalasia, showing incomplete LES relaxation and absence of peristalsis in the esophageal body."
    },
    {
        "question": "Which of the following is the most common benign tumor of the liver?",
        "options": ["Hepatic adenoma", "Focal nodular hyperplasia", "Hemangioma", "Hepatoblastoma", "Regenerative nodule"],
        "correct_index": 2,
        "explanation": "Hemangioma is the most common benign tumor of the liver, usually found incidentally and rarely requires treatment."
    },
    {
        "question": "In viral hepatitis, which marker indicates high infectivity in Hepatitis B?",
        "options": ["HBsAg", "HBeAg", "Anti-HBc IgM", "Anti-HBs", "HBV DNA"],
        "correct_index": 1,
        "explanation": "HBeAg indicates active viral replication and high infectivity. Its presence suggests the patient is highly contagious."
    },
    {
        "question": "A 40-year-old male with history of IV drug use presents with fatigue and elevated liver enzymes. Anti-HCV is positive. What is the next step?",
        "options": ["Liver biopsy", "HCV RNA viral load", "Start interferon", "Repeat anti-HCV in 6 months", "CT scan abdomen"],
        "correct_index": 1,
        "explanation": "After positive anti-HCV, HCV RNA viral load should be checked to confirm active infection and guide treatment decisions."
    },
    {
        "question": "Which of the following is the drug of choice for amoebic liver abscess?",
        "options": ["Albendazole", "Metronidazole", "Praziquantel", "Mebendazole", "Ivermectin"],
        "correct_index": 1,
        "explanation": "Metronidazole is the drug of choice for invasive amoebiasis including amoebic liver abscess. It's usually followed by a luminal agent like diloxanide furoate."
    },
    {
        "question": "What type of diarrhea is caused by Vibrio cholerae?",
        "options": ["Invasive diarrhea", "Secretory diarrhea", "Osmotic diarrhea", "Inflammatory diarrhea", "Dysentery"],
        "correct_index": 1,
        "explanation": "Vibrio cholerae causes secretory diarrhea by producing cholera toxin that activates adenylate cyclase, leading to massive chloride and water secretion."
    }
]

# Read existing KGMC file
kgmc_file = os.path.join(output_dir, 'kgmc K.enc')
with open(kgmc_file, 'rb') as f:
    encrypted = f.read()
existing_kgmc = xor_encrypt_decrypt(encrypted, key).decode('utf-8')

# Count existing questions
existing_count = existing_kgmc.count('INSERT INTO preproff')
print(f"Existing KGMC questions: {existing_count}")

# Add copied WMC questions
new_inserts = []
for q in wmc_questions_to_copy:
    sql = create_sql_insert(q['question'], q['options'], q['correct_index'], q['explanation'], 'K', 'KGMC', '2023')
    new_inserts.append(sql)

# Add new KGMC questions
for q in new_kgmc_questions:
    sql = create_sql_insert(q['question'], q['options'], q['correct_index'], q['explanation'], 'K', 'KGMC', '2023')
    new_inserts.append(sql)

# Combine and save KGMC
updated_kgmc = existing_kgmc.rstrip() + '\n' + '\n'.join(new_inserts)
encrypted_kgmc = xor_encrypt_decrypt(updated_kgmc.encode('utf-8'), key)
with open(kgmc_file, 'wb') as f:
    f.write(encrypted_kgmc)

new_kgmc_count = updated_kgmc.count('INSERT INTO preproff')
print(f"Updated KGMC questions: {new_kgmc_count} (added {new_kgmc_count - existing_count})")

# Read existing KMC file
kmc_file = os.path.join(output_dir, 'kmc K.enc')
with open(kmc_file, 'rb') as f:
    encrypted = f.read()
existing_kmc = xor_encrypt_decrypt(encrypted, key).decode('utf-8')

existing_kmc_count = existing_kmc.count('INSERT INTO preproff')
print(f"\nExisting KMC questions: {existing_kmc_count}")

# Add new KMC questions
kmc_inserts = []
for q in new_kmc_questions:
    sql = create_sql_insert(q['question'], q['options'], q['correct_index'], q['explanation'], 'K', 'KMC', '2023')
    kmc_inserts.append(sql)

# Combine and save KMC
updated_kmc = existing_kmc.rstrip() + '\n' + '\n'.join(kmc_inserts)
encrypted_kmc = xor_encrypt_decrypt(updated_kmc.encode('utf-8'), key)
with open(kmc_file, 'wb') as f:
    f.write(encrypted_kmc)

new_kmc_count = updated_kmc.count('INSERT INTO preproff')
print(f"Updated KMC questions: {new_kmc_count} (added {new_kmc_count - existing_kmc_count})")

print("\n✅ Questions added successfully!")
print(f"   KGMC: {existing_count} → {new_kgmc_count} (+{new_kgmc_count - existing_count})")
print(f"   KMC: {existing_kmc_count} → {new_kmc_count} (+{new_kmc_count - existing_kmc_count})")
