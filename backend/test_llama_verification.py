import time
import json
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

api_key = os.getenv("AI_API_KEY")
base_url = os.getenv("AI_BASE_URL")
model_name = os.getenv("AI_MODEL_NAME", "llama-3.1-8b-instant")

if not api_key:
    print("Error: AI_API_KEY not found.")
    exit(1)

client = OpenAI(api_key=api_key, base_url=base_url)

def check_with_llama(user_answer, correct_meaning):
    start_time = time.time()
    
    prompt = f"""
    Compare the meaning of the two sentences below.
    
    1. Correct Meaning: "{correct_meaning}"
    2. User Answer: "{user_answer}"
    
    Are they semantically similar in the given context?
    Even if the words are different, if the core meaning is the same, it is Correct.
    If the meaning is opposite or irrelevant, it is Incorrect.
    
    Return JSON:
    {{
        "is_correct": boolean,
        "similarity_score": integer (0-100),
        "reason": "short explanation"
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a strict evaluator. Output JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1, # Low temperature for consistency
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        result = json.loads(content)
        
        end_time = time.time()
        latency = end_time - start_time
        
        print(f"\n[Test] '{user_answer}' vs '{correct_meaning}'")
        print(f"Result: {result['is_correct']} (Score: {result['similarity_score']})")
        print(f"Reason: {result['reason']}")
        print(f"Latency: {latency:.4f}s")
        return result, latency
        
    except Exception as e:
        print(f"Error: {e}")
        return None, 0

print(f"Testing Model: {model_name}")

# Test Cases
# 1. Antonym (Should be False)
check_with_llama("매우 화가 난다", "기분이 정말 좋다")

# 2. Synonym (Should be True)
check_with_llama("배가 고프다", "식사를 하고 싶다")

# 3. Contextual (Should be True)
check_with_llama("이 문제의 정답은 무엇인가요?", "답 좀 알려줘")

# 4. Irrelevant (Should be False)
check_with_llama("사과", "우주선")
