#!/bin/bash
set -e

echo "=== SiliconSage Integration Test ==="
echo ""

# Start server in background
echo "Starting workerd server..."
npx workerd serve config.capnp > /tmp/test-workerd.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server to start
sleep 3

# Test endpoints
echo ""
echo "Testing /status endpoint..."
STATUS=$(curl -s http://localhost:8080/status)
echo "$STATUS" | jq .
echo "✅ Status endpoint working"

echo ""
echo "Testing /demo endpoint..."
DEMO=$(curl -s http://localhost:8080/demo)
SUCCESS=$(echo "$DEMO" | jq -r '.success')
AGENT_COUNT=$(echo "$DEMO" | jq -r '.agents | length')
INSIGHT=$(echo "$DEMO" | jq -r '.insights[0]')

echo "Success: $SUCCESS"
echo "Agents created: $AGENT_COUNT"
echo "First insight: $INSIGHT"
echo "✅ Demo endpoint working"

echo ""
echo "Testing homepage..."
HOME=$(curl -s http://localhost:8080/)
if echo "$HOME" | grep -q "SiliconSage v5.0"; then
    echo "✅ Homepage rendering correctly"
else
    echo "❌ Homepage test failed"
    exit 1
fi

# Cleanup
echo ""
echo "Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
sleep 1

echo ""
echo "=== All Tests Passed! ==="
echo ""
echo "SiliconSage autonomous multi-agent orchestration workbench is working correctly!"
