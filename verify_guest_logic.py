import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_guest_flow():
    print("--- Testing Guest Login Flow ---")
    
    # 1. Guest Login
    try:
        resp = requests.post(f"{BASE_URL}/auth/guest")
        print(f"Guest Login Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Error Body: {resp.text}")
            return
        
        token = resp.json().get("access_token")
        print(f"Token: {token[:10]}...")
    except Exception as e:
        print(f"Guest Login Exception: {e}")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Identify
    try:
        resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
        print(f"Identity Status: {resp.status_code}")
        if resp.status_code == 200:
            print(f"User Data: {resp.json()}")
        else:
            print(f"Error Body: {resp.text}")
    except Exception as e:
        print(f"Identity Exception: {e}")

    # 3. Fetch Questions
    try:
        resp = requests.get(f"{BASE_URL}/questions?category=Politics", headers=headers)
        print(f"Fetch Questions Status: {resp.status_code}")
        if resp.status_code == 200:
            questions = resp.json().get("questions", [])
            print(f"Questions Count: {len(questions)}")
            if questions:
                q_id = questions[0]['id']
                
                # 4. Verify Answer
                print(f"Verifying Answer for QID: {q_id}")
                payload = {"questionId": q_id, "userAnswer": "test"}
                resp = requests.post(f"{BASE_URL}/verify", json=payload, headers=headers)
                print(f"Verify Status: {resp.status_code}")
                with open("error_log.txt", "w", encoding="utf-8") as f:
                    f.write(resp.text)
                print(f"Verify Body saved to error_log.txt")
        else:
            print(f"Error Body: {resp.text}")
    except Exception as e:
        print(f"Fetch/Verify Exception: {e}")

if __name__ == "__main__":
    test_guest_flow()
