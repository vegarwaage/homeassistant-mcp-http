#!/bin/bash
set -e

# Get configuration
CONFIG_PATH=/data/options.json
OAUTH_CLIENT_URL=$(jq --raw-output '.oauth_client_url' $CONFIG_PATH)

if [ -z "$OAUTH_CLIENT_URL" ] || [ "$OAUTH_CLIENT_URL" = "null" ]; then
    echo "[ERROR] oauth_client_url not configured!"
    echo "[ERROR] Please configure your DuckDNS URL in addon options"
    exit 1
fi

# Export environment variables
export OAUTH_CLIENT_URL="${OAUTH_CLIENT_URL}"
export SUPERVISOR_TOKEN="${SUPERVISOR_TOKEN}"
export INGRESS_PATH="${INGRESS_PATH}"

echo "[INFO] Starting MCP HTTP Server..."
echo "[INFO] OAuth Client URL: ${OAUTH_CLIENT_URL}"
echo "[INFO] Ingress Path: ${INGRESS_PATH}"

# Start server
cd /app
exec node dist/http-server.js
