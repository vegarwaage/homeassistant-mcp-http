#!/bin/sh
set -e

echo "[INFO] Starting MCP HTTP Server..."

# Get configuration using jq
CONFIG_PATH=/data/options.json

if [ ! -f "$CONFIG_PATH" ]; then
    echo "[ERROR] Configuration file not found at $CONFIG_PATH"
    exit 1
fi

OAUTH_CLIENT_URL=$(jq --raw-output '.oauth_client_url // empty' $CONFIG_PATH)

if [ -z "$OAUTH_CLIENT_URL" ]; then
    echo "[ERROR] oauth_client_url not configured!"
    echo "[ERROR] Please configure your DuckDNS URL in addon options"
    exit 1
fi

# Export environment variables
export OAUTH_CLIENT_URL="${OAUTH_CLIENT_URL}"
export SUPERVISOR_TOKEN="${SUPERVISOR_TOKEN}"
export INGRESS_PATH="${INGRESS_PATH}"

echo "[INFO] OAuth Client URL: ${OAUTH_CLIENT_URL}"
echo "[INFO] Ingress Path: ${INGRESS_PATH}"

# Start server
cd /app || exit 1
exec node dist/http-server.js
