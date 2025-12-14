/**
 * Add missing NWSM 2025 questions to M1 and M2
 */

const fs = require('fs');
const path = require('path');

const ENCRYPTION_KEY = "SUPERSIX_SECURE_KEY_2025";

function decrypt(encryptedBuffer) {
    const keyBytes = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    const decryptedBytes = Buffer.alloc(encryptedBuffer.length);
    for (let i = 0; i < encryptedBuffer.length; i++) {
        decryptedBytes[i] = encryptedBuffer[i] ^ keyBytes[i % keyBytes.length];
    }
    return decryptedBytes.toString('utf-8');
}

function encrypt(plainText) {
    const plainBytes = Buffer.from(plainText, 'utf-8');
    const keyBytes = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    const encryptedBytes = Buffer.alloc(plainBytes.length);
    for (let i = 0; i < plainBytes.length; i++) {
        encryptedBytes[i] = plainBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return encryptedBytes;
}

function escapeSQL(str) {
    return str.replace(/'/g, "''");
}

// Missing ENT questions for M1
const entQuestions = [
    {
        text: "Despite aggressive treatment strategies, her polyps recur and her chest infections also are getting worse. Her sweat chloride test was ordered and it was abnormal. The child is suffering from",
        options: ["Allergic rhinitis", "Chronic rhinosinusitis", "Cystic fibrosis", "Rhinolith", "Sarcoidosis"],
        correct: 2,
        explanation: "The combination of recurrent nasal polyps, recurrent chest infections, and an abnormal sweat chloride test is diagnostic of Cystic Fibrosis.",
        topic: "Nasal Polyps"
    },
    {
        text: "A 43 years old male patient came through OPD with the history of nasal obstruction, headache, post nasal drip associated with decreased sense of smell lethargy and intermittent ear clogging. On examination of the nose there is white glistening soft tissue mass which are insensitive to touch. Which is the most suitable option of the following",
        options: ["Acute rhinosinusitis with nasal polyposis", "Allergic rhinosinusitis", "Acute invasive fungal rhinosinusitis", "Chronic rhinosinusitis with nasal polyposis", "Chronic invasive fungal rhinosinusitis"],
        correct: 3,
        explanation: "The chronic symptoms (nasal obstruction, hyposmia, post-nasal drip) along with white glistening insensitive masses (nasal polyps) are characteristic of Chronic Rhinosinusitis with Nasal Polyposis.",
        topic: "Chronic Rhinosinusitis"
    },
    {
        text: "A 60 years old male patient who is known case of uncontrolled diabetes and hypertension admitted in medical ward for fever, progressively increasing headache and has developed left periorbital edema for the last one day. On examination there is black crusting in his left nasal cavity and has restricted eye movements with decreased visual acuity. What is the most likely diagnosis?",
        options: ["Allergic Rhinosinusitis", "Acute bacterial rhinosinusitis", "Acute meningitis", "Mucormycosis", "Orbital cellulitis"],
        correct: 3,
        explanation: "Black crusting (eschar) in the nasal cavity of a diabetic patient with orbital involvement is pathognomonic of Rhinocerebral Mucormycosis, a fungal emergency.",
        topic: "Fungal Infections"
    },
    {
        text: "A 50 years old male patient came through opd with the history of hard-of-hearing and foul smelling left ear discharge for the last 6-7 years. The patient developed headache and nausea for the last 7-10 days. The patient fails to take the names of common objects like cup and saucer but can demonstrate their use. What would be the possible cause of this condition;",
        options: ["Chronic otitis media with cholesteatoma", "Cerebellar brain abscess", "Lateral sinus thrombosis", "Otitic hydrocephalus", "Temporal lobe abscess"],
        correct: 4,
        explanation: "The inability to name objects but ability to demonstrate their use is anomic aphasia, indicating temporal lobe involvement. Combined with chronic ear discharge, this suggests a Temporal Lobe Abscess as a complication of CSOM.",
        topic: "Complications of CSOM"
    },
    {
        text: "A 31 years old male patient come to ENT clinic with the history of bilateral nasal obstruction for the last 10 months. associated with post nasal drips and hyposmia. Examination reveals bilateral nasal polyposis. CT nose and paranasal sinuses shows differential densities in maxillary sinuses and ethmoid sinuses. Peroperative caseous and jelly like materials found along with nasal polyps. What is the most probable diagnosis?",
        options: ["Acute rhinosinusitis", "Allergic fungal rhinosinusitis", "Chronic rhinosinusitis", "Fungal ball", "Invasive fungal rhinosinusitis"],
        correct: 1,
        explanation: "The presence of nasal polyps with caseous/jelly-like material (allergic mucin) and differential densities on CT (due to metallic content) is characteristic of Allergic Fungal Rhinosinusitis (AFRS).",
        topic: "Fungal Rhinosinusitis"
    },
    {
        text: "A 53 years old male healthy patient came through OPD with the history of nasal obstruction, headache associated with sneezing, watery eyes and post nasal drip. On examination he has periorbital edema and nasal polyposis. The nasal discharge has eosinophilia and Charcot-Leyden crystals. Which of the following describes best the aforementioned conditions;",
        options: ["Allergic fungal rhinosinusitis", "Allergic rhinitis with nasal polyposis", "Chronic rhinosinusitis with nasal polyposis", "Non-allergic rhinitis with eosinophilia syndrome", "Vasomotor rhinitis"],
        correct: 0,
        explanation: "The triad of nasal polyps, eosinophilia in nasal secretions, and Charcot-Leyden crystals is characteristic of Allergic Fungal Rhinosinusitis (AFRS).",
        topic: "Fungal Rhinosinusitis"
    },
    {
        text: "A 34 years old female patient came through OPD with the history of nasal obstruction, mucopurulent nasal discharge associated with headache and facial pain worsens with straining and bending over. What do you think it would be",
        options: ["Acute rhinosinusitis", "Allergic rhinitis", "Chronic rhinosinusitis", "Migraine", "Tension headache"],
        correct: 0,
        explanation: "Nasal obstruction, mucopurulent discharge, facial pain worsening with straining/bending are classic symptoms of Acute Rhinosinusitis.",
        topic: "Acute Rhinosinusitis"
    },
    {
        text: "A 25 years old male patient came from Afghanistan with the history of hard-of-hearing and painless foul smelling ear discharge for the last 6-7 months. On otoscopy the tympanic membrane has multiple small perforations and pale granulations in the middle ear cavity. What do you expect of the following?",
        options: ["Aero-otitis media", "Chronic otitis media", "Recurrent acute otitis media", "Syphilitic otitis media", "Tubercular otitis media"],
        correct: 4,
        explanation: "Multiple small perforations with pale granulations in the middle ear, especially in a patient from an endemic region, is characteristic of Tubercular Otitis Media.",
        topic: "Tubercular Otitis Media"
    }
];

// Missing Eye question for M2
const eyeQuestions = [
    {
        text: "A 58 yr old lady having cataracts in both eyes presents to eye emergency department with the complaint of sudden onset of pain and gross dimness of vision in her right eye. On examination of the right eye the cornea is edematous, anterior chamber is shallow, pupil is mid-dilated, with dense cataract, intraocular pressure is 60mmHg. The lady is suffering from:",
        options: ["Pigmentary glaucoma", "Inflammatory glaucoma", "Neovascular glaucoma", "Phacomorphic glaucoma", "Pseudoexfoliation glaucoma"],
        correct: 3,
        explanation: "A mature/swollen cataract causing secondary angle closure with very high IOP is classic Phacomorphic Glaucoma. The intumescent lens pushes the iris forward, blocking the angle.",
        topic: "Secondary Glaucoma"
    }
];

function addQuestions(filePath, questions, subject, block) {
    console.log(`\nAdding ${questions.length} questions to ${path.basename(filePath)}`);
    
    const content = decrypt(fs.readFileSync(filePath));
    
    let newStatements = '';
    questions.forEach((q, idx) => {
        const optionsJSON = JSON.stringify(q.options);
        const stmt = `INSERT INTO preproff (text, options, correct_index, explanation, subject, topic, difficulty, block, college, year) VALUES ('${escapeSQL(q.text)}', '${escapeSQL(optionsJSON)}', ${q.correct}, '${escapeSQL(q.explanation)}', '${subject}', '${escapeSQL(q.topic)}', 'Medium', '${block}', 'NWSM', '2025');`;
        newStatements += stmt + '\n';
        console.log(`  Added: ${q.text.substring(0, 50)}...`);
    });
    
    const newContent = content + newStatements;
    fs.writeFileSync(filePath, encrypt(newContent));
    console.log(`✅ Saved ${path.basename(filePath)}`);
}

function main() {
    console.log("=".repeat(70));
    console.log("ADDING MISSING NWSM 2025 QUESTIONS");
    console.log("=".repeat(70));
    
    const m1Path = path.join(__dirname, '..', 'public', 'qbanks', 'nwsm M1.enc');
    const m2Path = path.join(__dirname, '..', 'public', 'qbanks', 'nwsm M2.enc');
    
    // Add ENT questions to M1
    addQuestions(m1Path, entQuestions, 'ENT', 'M1');
    
    // Add Eye question to M2
    addQuestions(m2Path, eyeQuestions, 'Ophthalmology', 'M2');
    
    console.log("\n" + "=".repeat(70));
    console.log("DONE");
    console.log("=".repeat(70));
    console.log(`Added ${entQuestions.length} ENT questions to M1`);
    console.log(`Added ${eyeQuestions.length} Eye question to M2`);
}

main();
