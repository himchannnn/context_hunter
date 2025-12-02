import urllib.request
import json
import urllib.error

BASE_URL = "http://localhost:8001/api"

def post_json(url, data):
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode('utf-8'), 
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Status: {response.status}")
            print(f"Response: {response.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} {e.reason}")
        print(f"Response: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Error: {e}")

def get(url):
    try:
        with urllib.request.urlopen(url) as response:
            print(f"Status: {response.status}")
            print(f"Response: {response.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} {e.reason}")
        print(f"Response: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing Register...")
    post_json(f"{BASE_URL}/auth/register", {"username": "testuser_py", "password": "testpassword"})
    
    print("\nTesting Questions...")
    get(f"{BASE_URL}/questions?difficulty=1")

    print("\n--- DEBUG LOG TAIL ---")
    try:
        with open("debug.log", "r", encoding="utf-8") as f:
            lines = f.readlines()
            for line in lines[-50:]:
                print(line.strip())
    except Exception as e:
        print(f"Could not read debug.log: {e}")
