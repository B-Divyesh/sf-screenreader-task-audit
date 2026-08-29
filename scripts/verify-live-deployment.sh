#!/usr/bin/env sh
# Verifies the Azure Container App topology required by the SQLite report and limiter store.
# Usage: EXPECTED_BUILD_SHA=<commit> npm run verify:live-deployment
# Set EXPECTED_IMAGE to assert a nonstandard image reference explicitly.
set -eu

app_name=sf-screenreader-task-audit
resource_group=sociobot
base_url=${LIVE_BASE_URL:-https://screenreader-task-audit.sociobot.in}
expected_sha=${1:-${EXPECTED_BUILD_SHA:-}}
expected_image=${EXPECTED_IMAGE:-}
config_path=.factory/container-scale.json

if [ ! -f "$config_path" ]; then
  printf 'missing deployment contract: %s\n' "$config_path" >&2
  exit 2
fi

if [ -z "$expected_image" ] && [ -n "$expected_sha" ]; then
  short_sha=$(printf '%s' "$expected_sha" | cut -c1-12)
  expected_image="sociobotregistry.azurecr.io/$app_name:$short_sha"
fi
if [ -z "$expected_image" ]; then
  printf 'set EXPECTED_BUILD_SHA or EXPECTED_IMAGE to verify the exact candidate image\n' >&2
  exit 2
fi

app=$(az containerapp show --name "$app_name" --resource-group "$resource_group" --output json)
revisions=$(az containerapp revision list --name "$app_name" --resource-group "$resource_group" --output json)
printf '%s\n%s\n%s\n' "$(cat "$config_path")" "$app" "$revisions" | \
  EXPECTED_IMAGE="$expected_image" python3 -c '
import json
import os
import sys

decoder = json.JSONDecoder()
payload = sys.stdin.read()
config, config_end = decoder.raw_decode(payload)
remaining = payload[config_end:].lstrip()
app, app_end = decoder.raw_decode(remaining)
revisions, _ = decoder.raw_decode(remaining[app_end:].lstrip())

expected_scale = (config.get("minReplicas"), config.get("maxReplicas"))
if expected_scale != (1, 1):
    raise SystemExit(f"deployment contract must require exactly one replica, got min={expected_scale[0]!r} max={expected_scale[1]!r}")

template = app.get("properties", {}).get("template", {})
scale = template.get("scale") or {}
minimum = scale.get("minReplicas")
maximum = scale.get("maxReplicas")
if (minimum, maximum) != (1, 1):
    raise SystemExit(f"expected exactly one replica, got min={minimum!r} max={maximum!r}")

volume = config.get("persistentVolume") or {}
required_volume = {
    "name": volume.get("name"),
    "storageName": volume.get("storageName"),
    "storageType": volume.get("storageType"),
}
if not all(required_volume.values()) or not volume.get("mountPath"):
    raise SystemExit("deployment contract has no complete durable volume")

volumes = template.get("volumes") or []
if required_volume not in volumes:
    raise SystemExit(f"expected durable volume {required_volume!r}, got {volumes!r}")
containers = template.get("containers") or []
container = next((item for item in containers if item.get("name") == "app"), None)
if not container:
    raise SystemExit("deployment has no app container")
expected_mount = {"volumeName": volume["name"], "mountPath": volume["mountPath"]}
if expected_mount not in (container.get("volumeMounts") or []):
    raise SystemExit(f"expected durable volume mount {expected_mount!r}, got {container.get('volumeMounts')!r}")

expected_image = os.environ["EXPECTED_IMAGE"]
if container.get("image") != expected_image:
    raise SystemExit(f"expected current image {expected_image}, got {container.get('image')}")

active = [item for item in revisions if item.get("properties", {}).get("active")]
if len(active) != 1:
    raise SystemExit(f"expected exactly one active revision, got {len(active)}")
revision = active[0].get("properties", {})
not_ready = {
    "provisioningState": revision.get("provisioningState"),
    "runningState": revision.get("runningState"),
    "healthState": revision.get("healthState"),
    "replicas": revision.get("replicas"),
    "trafficWeight": revision.get("trafficWeight"),
}
if not (
    not_ready["provisioningState"] == "Provisioned"
    and not_ready["runningState"] == "Running"
    and not_ready["healthState"] == "Healthy"
    and isinstance(not_ready["replicas"], int)
    and not_ready["replicas"] >= 1
    and not_ready["trafficWeight"] == 100
):
    raise SystemExit(f"active revision is not ready with full traffic: {not_ready!r}")
revision_container = next((item for item in revision.get("template", {}).get("containers", []) if item.get("name") == "app"), None)
if not revision_container or revision_container.get("image") != expected_image:
    actual = revision_container.get("image") if revision_container else None
    raise SystemExit(f"expected active revision image {expected_image}, got {actual}")
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

printf 'deployment verified: one active ready revision; minReplicas=1 maxReplicas=1; durable volume mounted; image=%s; health=%s\n' "$expected_image" "$health"
