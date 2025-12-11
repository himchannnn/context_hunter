import requests
import sys

BASE_URL = "http://localhost:8000"

def test_guest_flow():
    print("=== Testing Ephemeral Guest Logic ===")
    
    # 1. Guest Login
    print("\n1. Requesting Guest Login...")
    try:
        resp = requests.post(f"{BASE_URL}/api/auth/guest")
        resp.raise_for_status()
        data = resp.json()
        token = data.get("access_token")
        if not token:
            print("FAILED: No access token received.")
            return
        print(f"SUCCESS: Token received. (Starts with: {token[:10]}...)")
    except Exception as e:
        print(f"FAILED: Could not connect or login. Is backend running? {e}")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check User Profile (Expect ID = -1)
    print("\n2. Checking User Profile...")
    try:
        resp = requests.get(f"{BASE_URL}/api/users/me", headers=headers)
        resp.raise_for_status()
        user = resp.json()
        print(f"User Info: ID={user.get('id')}, Username={user.get('username')}, IsGuest={user.get('is_guest')}")
        
        if user.get("id") == -1 and user.get("is_guest") is True:
            print("SUCCESS: User ID is -1 and is_guest is True.")
        else:
            print("FAILED: User ID should be -1 for ephemeral guest.")
    except Exception as e:
        print(f"FAILED: {e}")

    # 3. Check Notes (Expect Empty List)
    print("\n3. Checking Notes (Should be empty)...")
    try:
        resp = requests.get(f"{BASE_URL}/api/notes", headers=headers)
        resp.raise_for_status()
        notes = resp.json()
        print(f"Notes Count: {len(notes)}")
        if len(notes) == 0:
            print("SUCCESS: Notes list is empty.")
        else:
            print("FAILED: Notes should be empty for guest.")
    except Exception as e:
        print(f"FAILED: {e}")

    # 4. Create Note (Should be ignored/mocked)
    print("\n4. Attempting to create a note...")
    try:
        note_data = {
            "question_id": "q1_1", # Assuming this ID exists or string is accepted
            "user_answer": "Test Answer"
        }
        resp = requests.post(f"{BASE_URL}/api/notes", json=note_data, headers=headers)
        if resp.status_code == 200:
             note_resp = resp.json()
             if note_resp.get("id") == -1:
                 print("SUCCESS: Note creation returned mock response (id=-1).")
             else:
                 print(f"WARNING: Note returned unexpected ID: {note_resp.get('id')}")
        else:
            print(f"FAILED: Status Code {resp.status_code}")
            print(resp.text)
    except Exception as e:
        print(f"FAILED: {e}")

    # 5. Check Guestbook/Ranking (Should work)
    print("\n5. Testing Ranking Registration...")
    try:
        ranking_data = {
            "nickname": "GuestTester",
            "score": 100,
            "max_streak": 5,
            "difficulty": 1
        }
        # Ranking does NOT require auth header in current impl, but we can send it or not.
        # Based on code `create_guestbook(entry..., db)` uses Depends(get_db) but NOT Depends(get_current_user)
        resp = requests.post(f"{BASE_URL}/api/guestbook", json=ranking_data)
        resp.raise_for_status()
        print("SUCCESS: Ranking registered successfully.")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_guest_flow()
