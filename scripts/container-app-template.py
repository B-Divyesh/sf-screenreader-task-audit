#!/usr/bin/env python3
"""Build the Azure Container Apps template from this product's deployment contract.

The factory container deployer calls this file when `.factory/container-scale.json`
is present. Keeping the template generator in the product makes the SQLite
single-writer and durable-volume contract reviewable and regression-testable.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def fail(message: str) -> None:
    raise SystemExit(f"invalid container deployment contract: {message}")


def required_string(value: Any, name: str) -> str:
    if not isinstance(value, str) or not value:
        fail(f"{name} must be a non-empty string")
    return value


def build_template(contract: dict[str, Any], image: str, port: int) -> dict[str, Any]:
    min_replicas = contract.get("minReplicas")
    max_replicas = contract.get("maxReplicas")
    if not isinstance(min_replicas, int) or min_replicas < 0:
        fail("minReplicas must be a non-negative integer")
    if not isinstance(max_replicas, int) or max_replicas < min_replicas:
        fail("maxReplicas must be an integer no lower than minReplicas")

    volume = contract.get("persistentVolume")
    if not isinstance(volume, dict):
        fail("persistentVolume must be an object")
    name = required_string(volume.get("name"), "persistentVolume.name")
    storage_name = required_string(volume.get("storageName"), "persistentVolume.storageName")
    storage_type = required_string(volume.get("storageType"), "persistentVolume.storageType")
    mount_options = required_string(volume.get("mountOptions"), "persistentVolume.mountOptions")
    mount_path = required_string(volume.get("mountPath"), "persistentVolume.mountPath")
    if not mount_path.startswith("/"):
        fail("persistentVolume.mountPath must be absolute")

    return {
        "containers": [
            {
                "name": "app",
                "image": image,
                "resources": {"cpu": 0.5, "memory": "1Gi"},
                "env": [{"name": "PORT", "value": str(port)}],
                "volumeMounts": [{"volumeName": name, "mountPath": mount_path}],
            }
        ],
        "scale": {"minReplicas": min_replicas, "maxReplicas": max_replicas},
        "volumes": [
            {
                "name": name,
                "storageName": storage_name,
                "storageType": storage_type,
                "mountOptions": mount_options,
            }
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--contract", type=Path, required=True)
    parser.add_argument("--image", required=True)
    parser.add_argument("--port", type=int, required=True)
    args = parser.parse_args()
    if not args.image:
        fail("image must not be empty")
    if not 1 <= args.port <= 65535:
        fail("port must be between 1 and 65535")
    try:
        contract = json.loads(args.contract.read_text())
    except OSError as error:
        fail(f"could not read {args.contract}: {error}")
    except json.JSONDecodeError as error:
        fail(f"could not parse {args.contract}: {error.msg}")
    if not isinstance(contract, dict):
        fail("root must be an object")
    print(json.dumps(build_template(contract, args.image, args.port), separators=(",", ":")))


if __name__ == "__main__":
    main()
