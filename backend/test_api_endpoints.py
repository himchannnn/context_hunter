import urllib.request
import json
import urllib.error

BASE_URL = "http://127.0.0.1:8001/api"

def test_rankings():
    print(f"Testing {BASE_URL}/rankings...")
    try:
        with urllib.request.urlopen(f"{BASE_URL}/rankings") as response:
            data = json.load(response)
            print("Rankings Response:", json.dumps(data, ensure_ascii=False)[:100] + "...")
            return True
    except urllib.error.URLError as e:
        print(f"Rankings Error: {e}")
        return False

def test_verify():
    print(f"Testing {BASE_URL}/verify...")
    # First get a question to verify
    try:
        with urllib.request.urlopen(f"{BASE_URL}/questions?difficulty=1") as response:
            data = json.load(response)
            questions = data.get("questions", [])
            if not questions:
                print("No questions found, cannot test verify.")
                return False
            
            q_id = questions[0]['id']
            print(f"Verifying question {q_id}...")
            
            payload = json.dumps({"questionId": q_id, "userAnswer": "테스트"}).encode('utf-8')
            req = urllib.request.Request(f"{BASE_URL}/verify", data=payload, headers={'Content-Type': 'application/json'})
            
            try:
                with urllib.request.urlopen(req) as v_response:
                    v_data = json.load(v_response)
                    print("Verify Response:", v_data)
                    return True
            except urllib.error.URLError as e:
                if hasattr(e, 'read'):
                    print(f"Verify Error Content: {e.read().decode('utf-8')}")
                print(f"Verify Error: {e}")
                return False

    except urllib.error.URLError as e:
        print(f"Questions Fetch Error: {e}")
        return False

if __name__ == "__main__":
    if test_rankings() and test_verify():
        print("\nAll Backend Tests Passed!")
    else:
        print("\nSome Tests Failed.")
