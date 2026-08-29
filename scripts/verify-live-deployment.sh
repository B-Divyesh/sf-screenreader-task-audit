#!/usr/bin/env sh
# Verifies the Azure Container App topology required by the local SQLite limiter.
# Usage: scripts/verify-live-deployment.sh [expected-build-sha]
set -eu

app_name=sf-screenreader-task-audit
resource_group=sociobot
base_url=${LIVE_BASE_URL:-https://screenreader-task-audit.sociobot.in}
expected_sha=${1:-${EXPECTED_BUILD_SHA:-}}

scale=$(az containerapp show --name "$app_name" --resource-group "$resource_group" \
  --query 'properties.template.scale' --output json)
printf '%s' "$scale" | python3 -c '
import json
import sys

scale = json.load(sys.stdin)
minimum = scale.get("minReplicas")
maximum = scale.get("maxReplicas")
if (minimum, maximum) != (1, 1):
    raise SystemExit(f"expected exactly one replica, got min={minimum!r} max={maximum!r}")
'

health=$(curl --fail --silent --show-error --max-time 20 "$base_url/health")
printf '%s' "$health" | EXPECTED_BUILD_SHA="$expected_sha" python3 -c '
import json
import os
import sys

health = json.load(sys.stdin)
status = health.get("status")
if status != "ok":
    raise SystemExit(f"health status was {status!r}")
expected = os.environ.get("EXPECTED_BUILD_SHA", "")
actual = health.get("build_sha")
if expected and actual != expected:
    raise SystemExit(f"expected build_sha {expected}, got {actual}")
'

printf 'deployment verified: minReplicas=1 maxReplicas=1; health=%s\n' "$health"
