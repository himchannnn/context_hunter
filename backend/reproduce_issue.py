import os
import sys
import json
# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai import check_similarity
from dotenv import load_dotenv

# Load env vars
load_dotenv()

def test(user, correct):
    print(f"Testing: '{user}' vs '{correct}'")
    try:
        result = check_similarity(user, correct)
        return {"user": user, "correct": correct, "result": result}
    except Exception as e:
        return {"user": user, "correct": correct, "error": str(e)}

if __name__ == "__main__":
    results = []
    
    # Case 1: Exact Match
    results.append(test("사과", "사과"))
    
    # Case 2: Similar Meaning (The user said this sometimes gets 0%)
    results.append(test("배가 고프다", "식사를 하고 싶다"))
    results.append(test("나는 학교에 간다", "등교하는 중이다"))
    
    # Case 3: Imperfect Match (User said this sometimes gets 100%)
    results.append(test("나는 사과를 먹는다", "나는 사과를 섭취한다"))
    results.append(test("아버지가 방에 들어가신다", "아버지 가방에 들어가신다"))

    # Case 4: Totally Wrong
    results.append(test("하늘", "땅"))

    with open("reproduce_output.txt", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print("Test finished. Results saved to reproduce_output.txt")
