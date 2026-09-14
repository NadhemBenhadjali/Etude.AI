#!/bin/bash
# Database initialization script for Docker
# This runs automatically when the AI Pipeline container starts

set -e

echo "=========================================="
echo "Database Initialization Check"
echo "=========================================="
echo ""

# Wait for Neo4j to be ready (up to 15s)
echo "Waiting for Neo4j..."
for i in $(seq 1 15); do
    if curl -sf http://neo4j:7474 >/dev/null 2>&1; then
        echo " ✓ Neo4j is ready"
        break
    fi
    echo -n "."
    sleep 1
done

# Wait for Qdrant to be ready (up to 15s)
echo "Waiting for Qdrant..."
for i in $(seq 1 15); do
    if curl -sf http://qdrant:6333/healthz >/dev/null 2>&1; then
        echo " ✓ Qdrant is ready"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "Checking if databases need to be populated..."
echo ""

# Run the database check and population script
python check_and_populate_databases.py || echo "⚠️ Database population check completed with warnings"

echo ""
echo "=========================================="
echo "Starting AI Pipeline Service..."
echo "=========================================="
echo ""

# Start the main application
exec python -m main

