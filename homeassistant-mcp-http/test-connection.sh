#!/bin/bash
# ABOUTME: Simple test script to verify HTTP server can start and respond
# ABOUTME: Tests health endpoint without requiring full OAuth setup

export OAUTH_CLIENT_URL="http://localhost:3000"
export SUPERVISOR_TOKEN="test"

echo "Starting HTTP server in background..."
node dist/http-server.js &
SERVER_PID=$!

echo "Server PID: $SERVER_PID"
sleep 3

echo "Testing health endpoint..."
curl -s http://localhost:3000/health
echo ""

echo "Stopping server..."
kill $SERVER_PID

echo "Test complete!"
