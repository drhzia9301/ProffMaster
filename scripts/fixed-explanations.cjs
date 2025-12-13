/**
 * Fixed Explanations for Problematic Questions
 * These will be used to patch the encrypted files
 */

const FIXED_EXPLANATIONS = [
  // 1. gmc J.enc - index 47
  {
    file: "gmc J.enc",
    index: 47,
    questionPreview: "Which of the following drugs is not commonly used for the treatment of Parkinson?",
    originalExplanation: "Carbamazepine is an anticonvulsant...",
    fixedExplanation: "Carbamazepine is an anticonvulsant and mood stabilizer used for seizures and bipolar disorder, not for Parkinson's disease. Standard Parkinson's medications include levodopa, dopamine agonists, MAO-B inhibitors, and anticholinergics."
  },

  // 2. gmc J.enc - index 81
  {
    file: "gmc J.enc",
    index: 81,
    questionPreview: "In a class of 140 medical students, the mean systolic blood pressure was found to be 120 mmHg...",
    fixedExplanation: "Using the Z-score formula: Z = (130-120)/5 = 2. In a normal distribution, approximately 2.28% of values fall above 2 standard deviations from the mean. The closest option is 2.4%."
  },

  // 3. gmc L.enc - index 40
  {
    file: "gmc L.enc",
    index: 40,
    questionPreview: "Patient with diabetes have an increased risk for all of the following except?",
    fixedExplanation: "Diabetes significantly increases the risk for cataracts (due to sorbitol accumulation), infections (impaired immunity), atherosclerosis (macrovascular disease), and peripheral neuropathy (microvascular). While pancreatic cancer has an association with diabetes, it is not considered a direct diabetic complication like the others."
  },

  // 4. gmc M1.enc - index 5
  {
    file: "gmc M1.enc",
    index: 5,
    questionPreview: "A 38-year-old gentleman reports of decreased hearing in the right ear for the last 2 years...",
    fixedExplanation: "A negative Rinne test on the right (BC > AC) with Weber lateralizing to the left ear indicates right-sided profound sensorineural hearing loss (dead ear). This creates a 'false negative' Rinne because the patient hears bone conduction through the better cochlea. Weber lateralizes to the better hearing ear in SNHL and to the affected ear in conductive loss."
  },

  // 5. gmc M1.enc - index 127
  {
    file: "gmc M1.enc",
    index: 127,
    questionPreview: "Which of the following structures are preserved in a radical neck dissection?",
    fixedExplanation: "In a classic radical neck dissection, the sternocleidomastoid muscle, internal jugular vein, and spinal accessory nerve are sacrificed. The vagus nerve, carotid artery, and brachial plexus are preserved. In modified radical neck dissection, one or more of SCM, IJV, or XI nerve may be preserved."
  },

  // 6. gmc M1.enc - index 166
  {
    file: "gmc M1.enc",
    index: 166,
    questionPreview: "A 50 years old female complains of dysphagia while taking solid foods. On examination she was anemic...",
    fixedExplanation: "For a middle-aged female with dysphagia and anemia, the combination suggests Plummer-Vinson (Patterson-Kelly) syndrome. Barium swallow is the most appropriate initial investigation to evaluate the structural cause of dysphagia and can reveal esophageal webs characteristic of this condition."
  },

  // 7. gmc M2.enc - index 47
  {
    file: "gmc M2.enc",
    index: 47,
    questionPreview: "Neovascular Glaucoma treatment...",
    fixedExplanation: "In neovascular glaucoma, medical therapy includes topical beta-blockers (like timolol) and carbonic anhydrase inhibitors to reduce intraocular pressure. Definitive treatment requires addressing the underlying cause (e.g., panretinal photocoagulation for diabetic retinopathy) and may include surgical options."
  },

  // 8. kgmc J.enc - index 88
  {
    file: "kgmc J.enc",
    index: 88,
    questionPreview: "In a case control study the association was shown between smoking and risk of Parkinson disease...",
    fixedExplanation: "Odds Ratio (OR) = (a × d) / (b × c) = (30 × 45) / (55 × 70) = 1350/3850 ≈ 0.35. An OR less than 1 suggests a negative (protective) association. This finding is consistent with epidemiological studies suggesting an inverse relationship between smoking and Parkinson's disease."
  },

  // 9. kgmc L.enc - index 17
  {
    file: "kgmc L.enc",
    index: 17,
    questionPreview: "Currently, Pakistan is in which stage of the demographic cycle:",
    fixedExplanation: "Pakistan is in the 'late expanding' or third stage of the demographic transition, characterized by declining birth rates while death rates remain low. This results in continued population growth but at a slower rate than earlier stages."
  },

  // 10. kgmc L.enc - index 45
  {
    file: "kgmc L.enc",
    index: 45,
    questionPreview: "A 36 year old patient has received an IM Methotrexate injection...",
    fixedExplanation: "After methotrexate treatment for ectopic pregnancy, a satisfactory response is defined as a decrease in serum beta-hCG of at least 15% between Day 4 and Day 7. A decrease of 25% or more from the initial level indicates successful treatment response."
  },

  // 11. kmc J.enc - index 147
  {
    file: "kmc J.enc",
    index: 147,
    questionPreview: "A 64 year old homeless male alcoholic is brought to the hospital...",
    fixedExplanation: "The clinical picture of a homeless alcoholic with subacute meningitis (fever, confusion, lymphocytic pleocytosis, high protein, low glucose) is highly suggestive of tuberculous meningitis. TB meningitis is common in immunocompromised and malnourished individuals and presents with gradual onset over weeks."
  },

  // 12. kmc J.enc - index 152
  {
    file: "kmc J.enc",
    index: 152,
    questionPreview: "A 58-year-old man presented with tinnitus, ipsilateral loss of hearing, unsteadiness...",
    fixedExplanation: "The symptoms of tinnitus, unilateral hearing loss, and unsteadiness suggest a cerebellopontine angle lesion affecting the vestibulocochlear nerve. Vestibular schwannoma (acoustic neuroma) is the most common tumor at this site. If not listed, meningioma is the second most common CPA tumor in adults."
  },

  // 13. kmc J.enc - index 221
  {
    file: "kmc J.enc",
    index: 221,
    questionPreview: "An old lady aged 60 years presented to emergency department with history of sudden onset of weakness...",
    fixedExplanation: "Crossed hemiplegia (ipsilateral cranial nerve palsy with contralateral body weakness) is the hallmark of a brainstem lesion. Left facial weakness with right-sided body weakness indicates involvement of the facial nucleus/nerve and the corticospinal tract before its decussation, localizing the lesion to the left side of the pons or medulla."
  },

  // 14. kmc K.enc - index 42
  {
    file: "kmc K.enc",
    index: 42,
    questionPreview: "A 4 days old baby girl born to G3P2 mother, presented with jaundice since her first day of life...",
    fixedExplanation: "Jaundice on the first day of life is pathological. With an O-negative mother and A-positive baby, both ABO and Rh incompatibility are present. In a multigravida (G3P2), Rh sensitization is likely if RhoGAM was not given. Both incompatibilities contribute to hemolytic disease; severe hyperbilirubinemia (27 mg/dl) is more consistent with Rh disease."
  },

  // 15. kmc L.enc - index 152
  {
    file: "kmc L.enc",
    index: 152,
    questionPreview: "A 32 years old woman who is a diagnosed case of Diabetes type 2 was diagnosed to have endometrial cancer...",
    fixedExplanation: "Endometrial cancer staging is surgical (FIGO). Pre-operative imaging for local staging includes MRI (best for myometrial invasion assessment) or transvaginal ultrasound. Chest X-ray screens for pulmonary metastases. Endometrial biopsy confirms the diagnosis but does not assess extent."
  },

  // 16. kmc L.enc - index 198
  {
    file: "kmc L.enc",
    index: 198,
    questionPreview: "A 68 years old male patient came to medical OPD with symptoms of low grade fever...",
    fixedExplanation: "The clinical presentation (flank mass, hematuria, weight loss, fever) describes the classic triad of renal cell carcinoma. 'Conventional carcinoma' refers to clear cell RCC, the most common malignant renal tumor (70-80% of cases). Clear cell RCC typically shows cells with abundant clear cytoplasm due to lipid and glycogen content."
  },

  // 17. kmc L.enc - index 215
  {
    file: "kmc L.enc",
    index: 215,
    questionPreview: "A woman in her 30's at 8 week of gestation with gravida 1...",
    fixedExplanation: "Causing miscarriage is classified under 'Isqat-i-Haml' in Pakistan Penal Code (PPC). This is a specific offense distinct from the categories of homicide (Qatl). If the options only include homicide categories, Qatl-i-khata (killing by mistake) may be selected for unintentional fetal death during medical procedures."
  },

  // 18. nwsm J.enc - index 17
  {
    file: "nwsm J.enc",
    index: 17,
    questionPreview: "A 20 year old man comes to A&E with high grade fever, neck stiffness and photo phobia...",
    fixedExplanation: "The CSF findings of increased pressure, neutrophilic pleocytosis, and decreased glucose with clinical signs of fever, neck stiffness, and photophobia are characteristic of acute bacterial meningitis. Fungal meningitis typically shows lymphocytic predominance but can have low glucose. Among non-bacterial options, fungal is most consistent with hypoglycorrhachia."
  },

  // 19. nwsm J.enc - index 71
  {
    file: "nwsm J.enc",
    index: 71,
    questionPreview: "Several tests have been developed to measure serologic markers of breast cancer...",
    fixedExplanation: "Positive Predictive Value (PPV) is influenced by both sensitivity and specificity, but specificity has a stronger impact, especially at low disease prevalence. High specificity means fewer false positives, directly improving PPV. The test with 97% specificity will have the highest PPV."
  },

  // 20. nwsm K.enc - index 175
  {
    file: "nwsm K.enc",
    index: 175,
    questionPreview: "A 28-year-old man presents to the ER after intentionally ingesting rat poison...",
    fixedExplanation: "Yellow phosphorus poisoning has a characteristic biphasic course: initial GI irritation with garlic-odor breath, followed by a symptom-free period of 2-3 days, then delayed fulminant hepatic failure (jaundice, bleeding, encephalopathy). The triad of jaundice, bleeding gums, and altered sensorium indicates hepatic failure."
  },

  // 21. wmc J.enc - index 12
  {
    file: "wmc J.enc",
    index: 12,
    questionPreview: "A 32-year-old woman presents with a 2-day history of headache, vomiting, and fever...",
    fixedExplanation: "The combination of headache, fever, neck stiffness, neutrophilic pleocytosis, and low CSF glucose is diagnostic of acute bacterial meningitis. Neisseria meningitidis (meningococcal meningitis) is a common cause in young adults and can present with rapid progression and characteristic petechial rash."
  },

  // 22. wmc J.enc - index 112
  {
    file: "wmc J.enc",
    index: 112,
    questionPreview: "How many main statistical methodologies are used in data analysis?",
    fixedExplanation: "Statistics is broadly divided into descriptive statistics (summarizing data), inferential statistics (drawing conclusions about populations from samples), and sometimes predictive/exploratory methods. Most curricula recognize 2-3 main methodological branches."
  },

  // 23. wmc J.enc - index 166
  {
    file: "wmc J.enc",
    index: 166,
    questionPreview: "After attending a wedding function, 80 people suffered from food poisoning...",
    fixedExplanation: "If a food is NOT a source of the outbreak, the attack rate in those who ate it should equal those who didn't eat it, resulting in a Relative Risk (RR) of 1.0. An RR of 0.5 actually suggests the food was protective. An RR close to 1 (like 1.1) indicates no significant association with the illness."
  },

  // 24. wmc M1.enc - index 123
  {
    file: "wmc M1.enc",
    index: 123,
    questionPreview: "Unilateral nasal discharge and unilateral nasal obstruction in 13 years boy...",
    fixedExplanation: "In an adolescent male with unilateral nasal obstruction and discharge, the differential includes antrochoanal polyp and juvenile nasopharyngeal angiofibroma. Angiofibroma is a vascular tumor exclusive to adolescent males, presenting with recurrent epistaxis and obstruction. If not listed, antrochoanal polyp is another important consideration for unilateral symptoms."
  },

  // 25. initial_db.enc - forensic_medicine_1642
  {
    file: "initial_db.enc",
    id: "forensic_medicine_1642",
    questionPreview: "The fatal dose of DDT is about:",
    fixedExplanation: "The estimated fatal dose of DDT in humans is approximately 150-500 mg/kg body weight. At typical adult weight, this translates to roughly 10-30 grams total ingestion. DDT causes neurotoxicity with tremors, seizures, and respiratory failure."
  },

  // 26. initial_db.enc - community_medicine_1657
  {
    file: "initial_db.enc",
    id: "community_medicine_1657",
    questionPreview: "The results of an epidemiological study shows that incidence of disease in children is more...",
    fixedExplanation: "Using the relationship P = I × D (Prevalence = Incidence × Duration): If incidence is higher in children but prevalence is equal between groups, then disease duration must be shorter in children. This shorter duration could result from faster recovery, higher case fatality, or both."
  },

  // 27. initial_db.enc - community_medicine_1662
  {
    file: "initial_db.enc",
    id: "community_medicine_1662",
    questionPreview: "Secondary attack rate is highest in:",
    fixedExplanation: "Secondary attack rate (SAR) measures person-to-person transmission within households or close contacts. Among common infectious diseases, measles has the highest SAR (>90%), followed by pertussis and chickenpox. Cholera, while highly infectious through water, has lower person-to-person SAR than these airborne diseases."
  },

  // 28. initial_db.enc - community_medicine_1726
  {
    file: "initial_db.enc",
    id: "community_medicine_1726",
    questionPreview: "The width of a confidence interval is determined by:",
    fixedExplanation: "Confidence interval width is determined by three factors: sample size (larger sample = narrower CI), standard deviation (more variation = wider CI), and confidence level (95% vs 99% - higher level = wider CI). Sample size is the most commonly manipulated factor in study design to achieve desired precision."
  },

  // 29. initial_db.enc - community_medicine_1818
  {
    file: "initial_db.enc",
    id: "community_medicine_1818",
    questionPreview: "All are included in criteria to eradicate a disease except:",
    fixedExplanation: "Criteria for disease eradication include: no animal reservoir, availability of effective vaccine, ability to diagnose easily, and no chronic carrier state. While absence of subclinical cases (like smallpox) is favorable, polio eradication is being pursued despite high subclinical rates, making this criterion less absolute."
  },

  // 30. initial_db.enc - community_medicine_1866
  {
    file: "initial_db.enc",
    id: "community_medicine_1866",
    questionPreview: "The following are indicators for identifying 'at risk' babies except:",
    fixedExplanation: "Standard 'at risk' indicators for babies include: low birth weight, twins/multiple births, previous sibling deaths, and social factors like single parenthood. Weight between 70-80% of expected is considered moderate malnutrition and is typically included in at-risk criteria, while weight 60-70% is severe."
  },

  // 31. initial_db.enc - gynecology_736
  {
    file: "initial_db.enc",
    id: "gynecology_736",
    questionPreview: "Characteristic of normal semen analysis all true EXCEPT:",
    fixedExplanation: "Normal WHO semen parameters (2010) include: volume ≥1.5 mL, concentration ≥15 million/mL, total motility ≥40%, progressive motility ≥32%, and morphology ≥4% normal forms (strict criteria). The morphology threshold is notably low, meaning even normal samples have many abnormally-shaped sperm."
  },

  // 32. initial_db.enc - gynecology_933
  {
    file: "initial_db.enc",
    id: "gynecology_933",
    questionPreview: "A 45 years old, P6, came to you with history of post coital bleeding...",
    fixedExplanation: "In cervical cancer staging, involvement of the upper third of vagina is Stage IIa, while hydronephrosis indicates Stage IIIb (extension to pelvic wall causing ureteral obstruction). Pain in the renal area with hydronephrosis suggests ureteral involvement, classifying this as Stage IIIb."
  },

  // 33. initial_db.enc - ophthalmology_322
  {
    file: "initial_db.enc",
    id: "ophthalmology_322",
    questionPreview: "Which of the following ocular involvements occurs in Rheumatoid arthritis?",
    fixedExplanation: "The most common ocular manifestation of rheumatoid arthritis is keratoconjunctivitis sicca (dry eye), occurring in up to 25% of patients due to secondary Sjögren syndrome. Scleritis and episcleritis are also associated but less frequent. Scleritis is associated with more severe systemic disease."
  },

  // 34. initial_db.enc - pathology_1438
  {
    file: "initial_db.enc",
    id: "pathology_1438",
    questionPreview: "Patients with diabetes mellitus have an increased risk of all of the following except:",
    fixedExplanation: "Diabetes is a well-established risk factor for cataracts, infections (due to impaired immunity), atherosclerosis (macrovascular disease), and peripheral neuropathy. While some studies show increased pancreatic cancer risk in diabetics, it is not considered a classic direct complication like microvascular and macrovascular diseases."
  },

  // 35. initial_db.enc - pharmacology_974
  {
    file: "initial_db.enc",
    id: "pharmacology_974",
    questionPreview: "Vasoconstrictors are less effective in prolonging anesthetic properties of:",
    fixedExplanation: "Bupivacaine is highly lipid-soluble and protein-bound, resulting in inherently long duration of action. Adding vasoconstrictors (epinephrine) provides less proportional benefit compared to short-acting agents like lidocaine. The drug's pharmacokinetic properties already provide prolonged tissue binding."
  },

  // 36. initial_db.enc - pharmacology_981
  {
    file: "initial_db.enc",
    id: "pharmacology_981",
    questionPreview: "Treatment of malignant hyperthermia includes all of the following EXCEPT:",
    fixedExplanation: "Malignant hyperthermia treatment includes: stopping triggering agents, hyperventilation with 100% O2, IV dantrolene (2.5 mg/kg, repeated up to 10 mg/kg), cooling measures, and treating arrhythmias. The standard dantrolene dose is 2.5 mg/kg initially, not 1 mg/kg, which would be subtherapeutic."
  },

  // 37. initial_db.enc - pharmacology_985
  {
    file: "initial_db.enc",
    id: "pharmacology_985",
    questionPreview: "A 30 years old woman presented with red and itch eczematoid dermatitis...",
    fixedExplanation: "Local anesthetic allergies are almost exclusively to ester-type agents (procaine, benzocaine, tetracaine) due to their PABA metabolite. Amide-type agents (lidocaine, bupivacaine, mepivacaine) rarely cause true allergies. Cocaine is an ester and can cause allergic reactions, though it is primarily used topically."
  },

  // 38. initial_db.enc - pharmacology_993
  {
    file: "initial_db.enc",
    id: "pharmacology_993",
    questionPreview: "A patient has had a documented severe allergic reaction to ester-type local anesthetics...",
    fixedExplanation: "Patients allergic to ester-type local anesthetics can safely receive amide-type agents (lidocaine, bupivacaine, mepivacaine, prilocaine) as there is no cross-reactivity between the two classes. If an ester is required, tetracaine and chloroprocaine should be avoided in such patients."
  },

  // 39. initial_db.enc - pharmacology_1035
  {
    file: "initial_db.enc",
    id: "pharmacology_1035",
    questionPreview: "Gabapentin has which mechanism of action?",
    fixedExplanation: "Gabapentin binds to the alpha-2-delta subunit of voltage-gated calcium channels, reducing calcium influx and decreasing release of excitatory neurotransmitters including glutamate. Despite its name, it does not act directly on GABA receptors but may increase GABA synthesis."
  },

  // 40. initial_db.enc - pharmacology_1066 (THE ONE FROM SCREENSHOT)
  {
    file: "initial_db.enc",
    id: "pharmacology_1066",
    questionPreview: "The older TCAs share all of the following adverse effects except which one?",
    fixedExplanation: "TCAs cause anticholinergic effects (dry mouth, constipation, urinary retention), sedation (H1 blockade), weight gain, orthostatic hypotension (alpha-1 blockade), and can lower seizure threshold. Sexual dysfunction, while possible with TCAs, is more prominently associated with SSRIs. Hence, sexual dysfunction is the relative exception among classic TCA side effects."
  },

  // 41. initial_db.enc - pharmacology_1116
  {
    file: "initial_db.enc",
    id: "pharmacology_1116",
    questionPreview: "Regarding clinical use of hormones and their analogs, which of the following is an analog GnRH?",
    fixedExplanation: "GnRH analogs include leuprolide, goserelin, nafarelin, and buserelin. Menotropins are gonadotropins (FSH/LH), not GnRH analogs. Mecasermin is recombinant IGF-1, and conivaptan is a vasopressin receptor antagonist. GnRH analogs are used in prostate cancer, endometriosis, and assisted reproduction."
  },

  // 42. initial_db.enc - surgery_1979
  {
    file: "initial_db.enc",
    id: "surgery_1979",
    questionPreview: "A 30 years old obese female on contraceptive drugs presents with pain in the epigastrium...",
    fixedExplanation: "An obese female on oral contraceptives has multiple risk factors for both gallstones (obesity, female, estrogen) and pancreatitis (hypertriglyceridemia from estrogen). Epigastric pain with radiation to the back favors pancreatitis. Estrogen-induced hypertriglyceridemia is a known cause of acute pancreatitis."
  },

  // 43. initial_db.enc - surgery_2032
  {
    file: "initial_db.enc",
    id: "surgery_2032",
    questionPreview: "A kocher incision for open cholecystectomy include cutting all the following structures expect one:",
    fixedExplanation: "Kocher's subcostal incision involves cutting: skin, subcutaneous tissue, anterior rectus sheath, rectus abdominis muscle (transected), posterior rectus sheath, and peritoneum. True deep fascia (as exists in limbs) is absent in the anterior abdominal wall, replaced by the rectus sheath and transversalis fascia."
  },

  // 44. initial_db.enc - surgery_2038
  {
    file: "initial_db.enc",
    id: "surgery_2038",
    questionPreview: "Regarding classification for cirrhosis does not include:",
    fixedExplanation: "Congenital gallbladder anomalies include: Phrygian cap (folded fundus), floating gallbladder (complete peritoneal covering), double gallbladder, agenesis, and intrahepatic gallbladder. High insertion of the cystic duct is a ductal variation rather than a gallbladder anomaly per se."
  },

  // 45. initial_db.enc - surgery_2088
  {
    file: "initial_db.enc",
    id: "surgery_2088",
    questionPreview: "A 60-year-old male is admitted with a 2 days history of lower abdominal pain...",
    fixedExplanation: "In a 60-year-old with lower abdominal pain, distention, and hyperactive bowel sounds, large bowel obstruction is likely. Common causes include colorectal carcinoma and sigmoid volvulus. Marked vomiting is typically an early feature of small bowel obstruction but occurs late in large bowel obstruction. Massive abdominal distention favors sigmoid volvulus."
  },

  // 46. initial_db.enc - surgery_2116
  {
    file: "initial_db.enc",
    id: "surgery_2116",
    questionPreview: "A neonate presents with abdominal distention and non-bilious vomiting...",
    fixedExplanation: "In a neonate with abdominal distention, Hirschsprung disease is the most likely diagnosis. It presents with failure to pass meconium within 48 hours, abdominal distention, and vomiting. Pyloric stenosis typically presents at 3-6 weeks (not neonatal period) with projectile non-bilious vomiting but minimal distention."
  },

  // 47. initial_db.enc - surgery_2152
  {
    file: "initial_db.enc",
    id: "surgery_2152",
    questionPreview: "In children, which of the following is NOT part of differential diagnosis of acute appendicitis?",
    fixedExplanation: "The differential diagnosis of acute appendicitis in children includes gastroenteritis, mesenteric adenitis, intussusception, Meckel's diverticulitis, and UTI. All are valid differentials. Intussusception primarily affects infants and toddlers (peak 6-36 months), making it less common in the typical school-age appendicitis patient."
  }
];

module.exports = { FIXED_EXPLANATIONS };

// Display summary
console.log('Fixed Explanations Summary:');
console.log('=' .repeat(50));
console.log(`Total fixes: ${FIXED_EXPLANATIONS.length}`);

// Group by file
const byFile = {};
for (const fix of FIXED_EXPLANATIONS) {
  if (!byFile[fix.file]) byFile[fix.file] = 0;
  byFile[fix.file]++;
}

console.log('\nBy File:');
for (const [file, count] of Object.entries(byFile)) {
  console.log(`  ${file}: ${count}`);
}
