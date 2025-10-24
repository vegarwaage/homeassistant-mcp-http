#!/usr/bin/with-contenv bashio

# Get OAuth URL from addon config
OAUTH_CLIENT_URL=$(bashio::config 'oauth_client_url')

if [ -z "$OAUTH_CLIENT_URL" ]; then
    bashio::log.error "oauth_client_url not configured!"
    bashio::log.error "Please configure your DuckDNS URL in addon options"
    exit 1
fi

# Export environment variables
export OAUTH_CLIENT_URL="${OAUTH_CLIENT_URL}"
export SUPERVISOR_TOKEN="${SUPERVISOR_TOKEN}"
export INGRESS_PATH="${INGRESS_PATH}"

bashio::log.info "Starting MCP HTTP Server..."
bashio::log.info "OAuth Client URL: ${OAUTH_CLIENT_URL}"
bashio::log.info "Ingress Path: ${INGRESS_PATH}"

# Start server
cd /app
exec node dist/http-server.js
