#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Neo4j Connection Diagnostic Tool

Run this script to diagnose Neo4j connectivity issues.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_dns_resolution():
    """Test if we can resolve the Neo4j hostname."""
    print("=" * 60)
    print("1. Testing DNS Resolution")
    print("=" * 60)

    from app.crew.config import URI

    # Extract hostname from URI
    import re
    match = re.search(r'://([^:]+):', URI)
    if match:
        hostname = match.group(1)
        print(f"Neo4j Hostname: {hostname}")

        try:
            import socket
            ip = socket.gethostbyname(hostname)
            print(f"✅ DNS Resolution: SUCCESS")
            print(f"   Resolved to: {ip}")
            return True
        except socket.gaierror as e:
            print(f"❌ DNS Resolution: FAILED")
            print(f"   Error: {e}")
            return False
    else:
        print(f"❌ Could not parse hostname from URI: {URI}")
        return False


def test_network_connectivity():
    """Test if we can reach the Neo4j server."""
    print("\n" + "=" * 60)
    print("2. Testing Network Connectivity")
    print("=" * 60)

    from app.crew.config import URI
    import re

    # Extract hostname and port
    match = re.search(r'://([^:]+):(\d+)', URI)
    if not match:
        print(f"❌ Could not parse connection details from URI: {URI}")
        return False

    hostname = match.group(1)
    port = int(match.group(2))

    print(f"Testing connection to {hostname}:{port}...")

    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((hostname, port))
        sock.close()

        if result == 0:
            print(f"✅ Network Connectivity: SUCCESS")
            print(f"   Port {port} is reachable")
            return True
        else:
            print(f"❌ Network Connectivity: FAILED")
            print(f"   Port {port} is not reachable (error code: {result})")
            return False
    except Exception as e:
        print(f"❌ Network Connectivity: ERROR")
        print(f"   {e}")
        return False


def test_neo4j_driver():
    """Test Neo4j driver connection."""
    print("\n" + "=" * 60)
    print("3. Testing Neo4j Driver Connection")
    print("=" * 60)

    try:
        from app.crew.config import URI, USER, PASSWORD
        from neo4j import GraphDatabase

        print(f"URI: {URI}")
        print(f"User: {USER}")
        print(f"Password: {'*' * len(PASSWORD)}")

        print("\nAttempting to connect...")
        driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))

        print("Testing connectivity...")
        driver.verify_connectivity()

        print("✅ Neo4j Driver: SUCCESS")
        print("   Connection verified")

        # Try a simple query
        print("\nTesting simple query...")
        with driver.session() as session:
            result = session.run("RETURN 1 AS test")
            record = result.single()
            if record and record["test"] == 1:
                print("✅ Query Execution: SUCCESS")
            else:
                print("⚠️  Query returned unexpected result")

        driver.close()
        return True

    except Exception as e:
        print(f"❌ Neo4j Driver: FAILED")
        print(f"   Error: {e}")
        print(f"   Type: {type(e).__name__}")
        return False


def test_knowledge_graph():
    """Test the Neo4jKG class."""
    print("\n" + "=" * 60)
    print("4. Testing Knowledge Graph Class")
    print("=" * 60)

    try:
        from app.crew.config import URI, USER, PASSWORD
        from app.crew.knowledge_graph import Neo4jKG

        kg = Neo4jKG(URI, USER, PASSWORD)

        print("Attempting to list all topics...")
        topics = kg.list_all_topics()

        print(f"✅ Knowledge Graph: SUCCESS")
        print(f"   Found {len(topics)} topics")

        if topics:
            print(f"\nSample topics:")
            for topic in topics[:5]:
                print(f"   - {topic}")

        kg.close()
        return True

    except Exception as e:
        print(f"❌ Knowledge Graph: FAILED")
        print(f"   Error: {e}")
        print(f"   Type: {type(e).__name__}")
        return False


def check_environment():
    """Check environment configuration."""
    print("=" * 60)
    print("0. Checking Environment Configuration")
    print("=" * 60)

    from app.crew.config import settings

    checks = {
        "NEO4J_URI": settings.NEO4J_URI,
        "NEO4J_USER": settings.NEO4J_USER,
        "NEO4J_PASSWORD": "***" if settings.NEO4J_PASSWORD else None,
        "QDRANT_URL": settings.QDRANT_URL,
        "REDIS_URL": settings.REDIS_URL,
    }

    all_ok = True
    for key, value in checks.items():
        status = "✅" if value else "❌"
        display_value = value if "PASSWORD" not in key else ("***" if value else "NOT SET")
        print(f"{status} {key}: {display_value}")
        if not value:
            all_ok = False

    return all_ok


def main():
    """Run all diagnostic tests."""
    print("\n" + "🔍 Neo4j Connection Diagnostic Tool\n")

    results = {}

    # Check environment
    results["environment"] = check_environment()

    # Test DNS
    results["dns"] = test_dns_resolution()

    # Test network connectivity (only if DNS works)
    if results["dns"]:
        results["network"] = test_network_connectivity()
    else:
        print("\n⏭️  Skipping network test (DNS failed)")
        results["network"] = False

    # Test Neo4j driver (only if network works)
    if results["network"]:
        results["driver"] = test_neo4j_driver()
    else:
        print("\n⏭️  Skipping driver test (network unreachable)")
        results["driver"] = False

    # Test Knowledge Graph (only if driver works)
    if results["driver"]:
        results["kg"] = test_knowledge_graph()
    else:
        print("\n⏭️  Skipping knowledge graph test (driver failed)")
        results["kg"] = False

    # Summary
    print("\n" + "=" * 60)
    print("DIAGNOSTIC SUMMARY")
    print("=" * 60)

    all_passed = all(results.values())

    for test, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test}")

    if all_passed:
        print("\n🎉 All tests passed! Neo4j is working correctly.")
        return 0
    else:
        print("\n⚠️  Some tests failed. See details above.")
        print("\nRecommendations:")

        if not results["environment"]:
            print("  1. Check your .env file has all required variables")
        if not results["dns"]:
            print("  2. Check internet connectivity and DNS configuration")
        if not results["network"]:
            print("  3. Check firewall settings and Neo4j Aura instance status")
        if not results["driver"]:
            print("  4. Verify Neo4j credentials and connection URI")

        print(f"\n📖 See NEO4J_CONNECTION_ISSUE.md for detailed troubleshooting")
        return 1


if __name__ == "__main__":
    sys.exit(main())

