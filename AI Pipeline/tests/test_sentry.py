"""
Quick test to verify Sentry integration with Python-specific DSN.
"""
import os
import sys

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("Testing Sentry Integration")
print("=" * 60)

# Test 1: Check environment variables
print("\n1. Checking environment variables...")
from app.crew.config import settings

sentry_dsn = os.getenv("SENTRY_DSN")
environment = os.getenv("ENVIRONMENT")
release = os.getenv("RELEASE_VERSION")

print(f"   SENTRY_DSN: {'✅ Set' if sentry_dsn else '❌ Not set'}")
if sentry_dsn:
    # Mask the DSN for security
    masked_dsn = sentry_dsn[:30] + "..." + sentry_dsn[-20:]
    print(f"   DSN (masked): {masked_dsn}")
print(f"   ENVIRONMENT: {environment or '❌ Not set'}")
print(f"   RELEASE_VERSION: {release or '❌ Not set'}")

# Test 2: Initialize Sentry
print("\n2. Initializing Sentry...")
try:
    from app.sentry_config import init_sentry

    result = init_sentry()

    if result:
        print("   ✅ Sentry initialized successfully!")
    else:
        print("   ⚠️  Sentry initialization skipped (DSN not set)")
except Exception as e:
    print(f"   ❌ Sentry initialization failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 3: Test error capture (optional - only if initialized)
if result:
    print("\n3. Testing error capture...")
    try:
        from app.sentry_config import capture_message, add_breadcrumb

        # Add a breadcrumb
        add_breadcrumb(
            "Sentry integration test",
            category="test",
            data={"test_id": "sentry_validation"}
        )

        # Send a test message
        capture_message(
            "Sentry integration test - Python AI Pipeline",
            level="info",
            tags={"test": "true", "component": "ai-pipeline"}
        )

        print("   ✅ Test message sent to Sentry")
        print("   Check your Sentry dashboard: https://sentry.io/")

    except Exception as e:
        print(f"   ⚠️  Could not send test message: {e}")

print("\n" + "=" * 60)
print("🎉 Sentry Integration Test Complete!")
print("=" * 60)
print("\nNext steps:")
print("1. Check Sentry dashboard for test message")
print("2. Start the application: uvicorn main:app --reload")
print("3. Trigger an error to test automatic capture")

