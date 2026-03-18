#!/bin/sh
set -e

# Validate required environment variable
if [ -z "$API_UPSTREAM_BASE_URL" ]; then
    echo "ERROR: API_UPSTREAM_BASE_URL environment variable is required"
    echo "Example: API_UPSTREAM_BASE_URL=http://survey-api-dev:3010/api"
    exit 1
fi

# Substitute environment variables in nginx template
envsubst '${API_UPSTREAM_BASE_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Validate nginx configuration
nginx -t

# Start nginx
exec nginx -g 'daemon off;'