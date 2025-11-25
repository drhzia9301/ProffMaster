import json

# Load the JSON file
with open('public/data/ophthalmology.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

print(f'✓ Loaded {len(questions)} questions')
print(f'\n=== Sample Questions ===')
for i in range(min(3, len(questions))):
    q = questions[i]
    print(f'\n{i+1}. Topic: {q.get("topic", "N/A")}')
    print(f'   Question: {q["question"][:80]}...')
    print(f'   Answer: {q.get("answer", "N/A")}')
