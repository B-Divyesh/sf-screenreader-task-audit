#!/usr/bin/env sh
# Confirms the public paid path without submitting payment details.
# Usage: scripts/verify-live-checkout.sh [billing-api-base]
set -eu

api_base=${1:-https://api.sociobot.in}
product=screenreader-task-audit
work_dir=$(mktemp -d "${TMPDIR:-/tmp}/screenreader-task-audit-checkout.XXXXXX")
trap 'rm -rf "$work_dir"' EXIT HUP INT TERM

curl --fail --silent --show-error --max-time 20 "$api_base/api/v1/products" > "$work_dir/products.json"
API_BASE="$api_base" PRODUCT="$product" python3 - "$work_dir/products.json" <<'PY'
import json
import os
import sys

product = next((item for item in json.load(open(sys.argv[1])).get("data", []) if item.get("slug") == os.environ["PRODUCT"]), None)
if product is None:
    raise SystemExit(f"{os.environ['PRODUCT']} is not enabled in the public product catalog")
if product.get("price_minor") != 3900 or product.get("currency") != "USD":
    raise SystemExit(f"unexpected catalog price: {product!r}")
expected_url = f"{os.environ['API_BASE']}/api/v1/products/{os.environ['PRODUCT']}/checkout"
if product.get("checkout_url") != expected_url:
    raise SystemExit(f"unexpected checkout URL: {product.get('checkout_url')!r}")
PY

status=$(curl --silent --show-error --max-time 20 --max-redirs 0 --dump-header "$work_dir/headers" --output /dev/null --write-out '%{http_code}' "$api_base/api/v1/products/$product/checkout")
[ "$status" = 303 ] || { printf 'expected checkout to return 303, got %s\n' "$status" >&2; exit 1; }
location=$(tr -d '\r' < "$work_dir/headers" | sed -n 's/^location: //Ip' | tail -n 1)
printf '%s' "$location" | grep -Eq '^https://checkout\.dodopayments\.com/session/cks_[A-Za-z0-9]+$' || { printf 'unexpected checkout destination: %s\n' "$location" >&2; exit 1; }

printf 'checkout verified: catalog USD 39.00; 303 to hosted Dodo session\n'
