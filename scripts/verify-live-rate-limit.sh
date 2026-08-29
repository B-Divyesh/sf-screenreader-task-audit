#!/usr/bin/env sh
# Checks the public, harmless missing-report route against the documented burst.
# Usage: scripts/verify-live-rate-limit.sh [base-url]
set -eu

base_url=${1:-https://screenreader-task-audit.sociobot.in}
client_ip=${RATE_LIMIT_CLIENT_IP:-198.51.100.250}
route="$base_url/api/reports/0123456789abcdef0123456789abcdef"

for request_number in $(seq 1 41); do
  response=$(curl --silent --show-error --output /dev/null --dump-header - --write-out '\n%{http_code}' \
    -H "X-Forwarded-For: $client_ip" "$route")
  status=$(printf '%s\n' "$response" | tail -n 1)
  headers=$(printf '%s\n' "$response" | sed '$d')
  if [ "$request_number" -le 40 ]; then
    [ "$status" = 404 ] || { printf 'request %s: expected 404, got %s\n' "$request_number" "$status" >&2; exit 1; }
  else
    [ "$status" = 429 ] || { printf 'request 41: expected 429, got %s\n' "$status" >&2; exit 1; }
    printf '%s\n' "$headers" | tr -d '\r' | grep -qi '^retry-after: 1$' || { printf 'request 41: Retry-After: 1 missing\n' >&2; exit 1; }
  fi
done

printf 'rate-limit verified: requests 1–40 returned 404; request 41 returned 429 with Retry-After: 1\n'
