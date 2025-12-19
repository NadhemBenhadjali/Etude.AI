import requests
import uuid

BASE_URL = "http://localhost:8000"


def test_health():
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200
    print("[PASS] Health check passed")


def test_summary():
    r = requests.post(
        f"{BASE_URL}/summary",
        json={"module": "التنفس"},
        headers={"X-Session-ID": f"test-{uuid.uuid4()}"},
        timeout=60
    )
    assert r.status_code == 200
    print("[PASS] Summary endpoint works")


def test_qa():
    r = requests.post(
        f"{BASE_URL}/qa",
        json={"question": "ما هو التنفس؟"},
        headers={"X-Session-ID": f"test-{uuid.uuid4()}"},
        timeout=60
    )
    assert r.status_code == 200
    print("[PASS] Q&A endpoint works")


def run_all():
    print("\nRunning AI Pipeline Integration Tests\n")
    try:
        test_health()
        test_summary()
        test_qa()
        print("\nAll tests passed!\n")
        return True
    except Exception as e:
        print(f"\nTest failed: {e}\n")
        return False


if __name__ == "__main__":
    exit(0 if run_all() else 1)

