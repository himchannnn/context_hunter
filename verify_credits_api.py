import requests
import json
import time

BASE_URL = "http://localhost:8000/api"
USERNAME = f"credit_test_{int(time.time())}"
PASSWORD = "password123"

def run_test():
    print(f"--- Testing Credit Logic for User: {USERNAME} ---")
    
    # 1. Signup
    print("1. Signing up...")
    resp = requests.post(f"{BASE_URL}/auth/register", json={"username": USERNAME, "password": PASSWORD})
    if resp.status_code != 200:
        print(f"Signup failed: {resp.text}")
        return
    print("Signup success.")

    # 2. Login
    print("2. Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": USERNAME, "password": PASSWORD})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login success.")

    # 3. Check Initial Credits
    print("3. Checking initial credits...")
    resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
    user_data = resp.json()
    print(f"Initial Credits: {user_data['credits']}")
    assert user_data['credits'] == 0

    # 4. Clear 'Politics' (First Time)
    print("4. Clearing 'Politics' domain...")
    date = time.strftime("%Y-%m-%d")
    resp = requests.post(f"{BASE_URL}/daily-progress", headers=headers, json={"date": date, "domain": "Politics"})
    data = resp.json()
    print(f"Response: {data}")
    
    if data.get("credits_awarded") == 10:
        print("PASS: Awarded 10 credits.")
    else:
        print("FAIL: Did not award 10 credits.")
        
    # Verify User Balance
    resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
    current_credits = resp.json()['credits']
    print(f"Current Credits: {current_credits}")
    assert current_credits == 10

    # 5. Clear 'Politics' (Duplicate)
    print("5. Clearing 'Politics' again (Duplicate)...")
    resp = requests.post(f"{BASE_URL}/daily-progress", headers=headers, json={"date": date, "domain": "Politics"})
    data = resp.json()
    print(f"Response: {data}")
    
    if data.get("credits_awarded") == 0:
        print("PASS: Correctly awarded 0 credits for duplicate.")
    else:
        print(f"FAIL: Awarded {data.get('credits_awarded')} credits for duplicate.")

    # 6. Clear 'Economy' (New Domain)
    print("6. Clearing 'Economy' domain...")
    resp = requests.post(f"{BASE_URL}/daily-progress", headers=headers, json={"date": date, "domain": "Economy"})
    data = resp.json()
    print(f"Response: {data}")
    
    if data.get("credits_awarded") == 10:
        print("PASS: Awarded 10 credits for new domain.")
    else:
        print("FAIL: Did not award 10 credits.")

    # Final Check
    resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
    final_credits = resp.json()['credits']
    print(f"Final Credits: {final_credits}")
    assert final_credits == 20
    print("--- ALL TESTS PASSED ---")

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"Test failed with error: {e}")
