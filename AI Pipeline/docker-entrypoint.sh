#!/bin/sh
# Database initialization script for Docker
# This runs automatically when the AI Pipeline container starts

set -e

echo "=========================================="
echo "Database Initialization Check"
echo "=========================================="
echo ""

# Wait for Neo4j to be ready
echo "Waiting for Neo4j to be ready..."
until curl -sf http://neo4j:7474 >/dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo " ✓ Neo4j is ready"

# Wait for Qdrant to be ready
echo "Waiting for Qdrant to be ready..."
until curl -sf http://qdrant:6333/healthz >/dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo " ✓ Qdrant is ready"

echo ""
echo "Checking if databases need to be populated..."
echo ""

# Run the database check and population script
python check_and_populate_databases.py

echo ""
echo "=========================================="
echo "Starting AI Pipeline Service..."
echo "=========================================="
echo ""

# Start the main application
exec python -m main

