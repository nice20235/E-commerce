"""One-shot probe for `/api/rpc` CheckTransaction side-effect.

Purpose
- Sends a JSON-RPC `CheckTransaction` request to your running backend.
- If the referenced transaction is already performed (state=2, perform_time>0),
  backend should reconcile the linked order (set `orders.status` to `PAID`).

Usage
- Ensure backend is running.
- Set env:
    RPC_URL (default: http://127.0.0.1:8000/api/rpc)
    RPC_USERNAME / RPC_PASSWORD (optional, if protected by BasicAuth)

Example:
    RPC_URL="https://your-domain.uz/api/rpc" \
    RPC_USERNAME="..." RPC_PASSWORD="..." \
    python -m scripts.checktransaction_reconcile_probe 171234567890
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any

import httpx


def _build_auth() -> httpx.Auth | None:
    user = os.getenv("RPC_USERNAME")
    pwd = os.getenv("RPC_PASSWORD")
    if user and pwd:
        return httpx.BasicAuth(user, pwd)
    return None


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("Usage: python -m scripts.checktransaction_reconcile_probe <acquirer_tx_id>", file=sys.stderr)
        return 2

    tx_id = argv[1]
    rpc_url = os.getenv("RPC_URL", "http://127.0.0.1:8000/api/rpc")

    payload: dict[str, Any] = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "CheckTransaction",
        "params": {"id": tx_id},
    }

    with httpx.Client(timeout=20.0, auth=_build_auth()) as client:
        r = client.post(rpc_url, json=payload)
        print("HTTP", r.status_code)
        try:
            data = r.json()
        except Exception:
            print(r.text)
            return 1

        print(json.dumps(data, ensure_ascii=False, indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
