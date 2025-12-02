import subprocess
import time
import requests
import sys
import os

# Ensure we are in the correct directory
os.chdir(os.path.join(os.getcwd(), 'backend'))

print("Starting backend server...")
# Start uvicorn in the background
process = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8002"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

base_url = "http://127.0.0.1:8002"
max_retries = 30

try:
    # Wait for server to start
    print("Waiting for server to be ready...")
    for i in range(max_retries):
        try:
            response = requests.get(f"{base_url}/", timeout=1)
            if response.status_code == 200:
                print("Server is ready!")
                break
        except requests.exceptions.ConnectionError:
            time.sleep(1)
            print(f"Retry {i+1}/{max_retries}...")
    else:
        print("Failed to connect to server.")
        sys.exit(1)

    # Test Health Check
    print("\n[Test 1] Health Check (/)")
    resp = requests.get(f"{base_url}/")
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.json()}")

    # Test Verify Answer (AI Integration)
    print("\n[Test 2] Verify Answer (/api/verify)")
    # We need a valid question ID. Since we might not have seeded data, 
    # we will try to get a question first or just use a dummy ID if the backend handles it gracefully.
    # Actually, verify_answer checks DB for question. 
    # Let's try to get questions first.
    
    print("Fetching questions...")
    resp_q = requests.get(f"{base_url}/api/questions?difficulty=1")
    if resp_q.status_code == 200 and resp_q.json()['questions']:
        question = resp_q.json()['questions'][0]
        q_id = question['id']
        print(f"Got question ID: {q_id}")
        
        payload = {
            "questionId": q_id,
            "userAnswer": "테스트 답변입니다" 
        }
        resp_v = requests.post(f"{base_url}/api/verify", json=payload)
        print(f"Status: {resp_v.status_code}")
        print(f"Response: {resp_v.json()}")
    else:
        print("No questions found or failed to fetch questions. Skipping verification test.")
        print(f"Questions Response: {resp_q.text}")

finally:
    print("\nStopping server...")
    process.terminate()
    process.wait()
