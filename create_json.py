import re
import json

# Read the ophthalmology.txt file  
with open('ophthalmology.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Split by any newline type
lines = content.replace('\r\n', '\n').replace('\r', '\n').split('\n')

questions = []
current_section = "Ophthalmology"
question_id = 1

i = 0
while i < len(lines):
    line = lines[i].strip()
    
    # Detect section
    if line.startswith('Section:'):
        current_section = line.replace('Section:', '').strip()
        i += 1
        continue
    
    # Skip empty lines and intro text
    if not line or line.startswith('Here are'):
        i += 1
        continue
    
    # Check if this looks like a question
    if (line.endswith('?') or line.endswith(':')) and len(line) > 30:
        if not line.startswith('Explanation'):
            question_text = line
            options = []
            explanation = ""
            
            # Read next lines for options
            i += 1
            while i < len(lines) and len(options) < 6:  # Allow up to 6 options
                opt_line = lines[i].strip()
                
                # Check for options (a. b. c. d. e.)
                if re.match(r'^[a-e]\.\s+', opt_line):
                    options.append(opt_line[3:].strip())
                    i += 1
                elif opt_line.startswith('Explanation:'):
                    explanation = opt_line.replace('Explanation:', '').strip()
                    i += 1
                    break
                elif opt_line:
                    i += 1
                else:
                    i += 1
            
            # Save question if valid
            if len(options) >= 3 and explanation:  # At least 3 options
                questions.append({
                    'id': f'oph_{question_id}',
                    'subject': 'Ophthalmology',
                    'difficulty': 'Medium',
                    'section': current_section,
                    'tags': [current_section],
                    'text': question_text,
                    'options': options,
                    'correctIndex': 1,  # Default to option b
                    'explanation': explanation
                })
                question_id += 1
        else:
            i += 1
    else:
        i += 1

print(f'✓ Parsed {len(questions)} questions')

# Save to public/data/ophthalmology.json
with open('public/data/ophthalmology.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f'✓ Saved to public/data/ophthalmology.json')
print(f'\n=== First 3 questions ===')
for i in range(min(3, len(questions))):
    q = questions[i]
    print(f'\n{i+1}. [{q["section"]}]')
    print(f'   {q["text"][:80]}...')
    print(f'   Options: {len(q["options"])}')
