#!/usr/bin/env bash

set -u

FRONTEND_URL="${FRONTEND_URL:-http://frontend:3000/}"
BACKEND_URL="${BACKEND_URL:-http://backend:3001/api}"

failures=0

check_service() {
    local name="$1"
    local url="$2"
    local status

    status=$(curl --silent --show-error \
        --output /dev/null \
        --write-out "%{http_code}" \
        --max-time 10 \
        "$url") || status="000"

    if [[ "$status" == "200" ]]; then
        echo "HEALTHY: $name returned HTTP $status"
    else
        echo "UNHEALTHY: $name returned HTTP $status"
        failures=$((failures + 1))
    fi
}

echo "===== TASKHUB HEALTH CHECK ====="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

check_service "frontend" "$FRONTEND_URL"
check_service "backend" "$BACKEND_URL"

echo "Total failures: $failures"

if [[ "$failures" -gt 0 ]]; then
    exit 1
fi

exit 0
