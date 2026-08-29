#!/usr/bin/env sh
# Checks the public, harmless missing-report route against the documented burst.
# Usage: scripts/verify-live-rate-limit.sh [base-url]
set -eu

base_url=${1:-https://screenreader-task-audit.sociobot.in}
client_ip=${RATE_LIMIT_CLIENT_IP:-198.51.100.250}
route="$base_url/api/reports/0123456789abcdef0123456789abcdef"

work_dir=$(mktemp -d "${TMPDIR:-/tmp}/screenreader-task-audit-rate-limit.XXXXXX")
trap 'rm -rf "$work_dir"' EXIT HUP INT TERM
request() {
  curl --silent --show-error --output /dev/null --dump-header - --write-out '\n%{http_code}' \
    -H "X-Forwarded-For: $client_ip" "$route"
}

run_burst() {
  request_total=$1
  expected_limited=$2
  burst_dir="$work_dir/$request_total"
  mkdir "$burst_dir"
  for request_number in $(seq 1 "$request_total"); do
    (
      curl --silent --show-error --output /dev/null --dump-header "$burst_dir/$request_number.headers" \
        --write-out '%{http_code}' -H "X-Forwarded-For: $client_ip" "$route" \
        > "$burst_dir/$request_number.status"
    ) &
  done
  wait

  ordinary=$(grep -h -x '404' "$burst_dir"/*.status | wc -l | tr -d ' ')
  limited=$(grep -h -x '429' "$burst_dir"/*.status | wc -l | tr -d ' ')
  [ "$ordinary" = 40 ] || { printf '%s-request burst: expected 40 ordinary 404 responses, got %s\n' "$request_total" "$ordinary" >&2; exit 1; }
  [ "$limited" = "$expected_limited" ] || { printf '%s-request burst: expected %s rate-limited 429 responses, got %s\n' "$request_total" "$expected_limited" "$limited" >&2; exit 1; }
  for status_file in "$burst_dir"/*.status; do
    if [ "$(cat "$status_file")" = 429 ]; then
      header_file=${status_file%.status}.headers
      tr -d '\r' < "$header_file" | grep -qi '^retry-after: 1$' || { printf '%s-request burst: Retry-After: 1 missing\n' "$request_total" >&2; exit 1; }
    fi
  done
}

# A burst must complete inside the one-second idle-reset window. This exact
# 41-request boundary proves the first request above the 40-request allowance
# is rejected without relying on the latency of 41 separate HTTPS handshakes.
sleep 2
run_burst 41 1

# A scaled-out deployment with per-replica state can accidentally pass a small
# burst. A simultaneous 100-request probe proves one shared allowance.
sleep 2
run_burst 100 60

# An idle second starts a fresh burst, so a harmless missing report is again
# allowed through to its normal 404 response.
sleep 2
recovered=$(request)
recovered_status=$(printf '%s\n' "$recovered" | tail -n 1)
[ "$recovered_status" = 404 ] || { printf 'recovery: expected 404 after one idle second, got %s\n' "$recovered_status" >&2; exit 1; }

printf 'rate-limit verified: concurrent 41=40x404/1x429; concurrent 100=40x404/60x429; idle recovery=404\n'
