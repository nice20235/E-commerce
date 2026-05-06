# Systemd: auto-reconcile payments

This service runs `scripts/auto_reconcile_daemon.py` continuously. It polls the acquirer via JSON-RPC `CheckTransaction` and marks orders `PAID` when the remote side reports the transaction performed.

## 1) Copy the unit

On the VPS:

- copy `deploy/systemd/stepup-reconcile.service` to:
  - `/etc/systemd/system/stepup-reconcile.service`

Then edit in-place:

- `User=`
- `WorkingDirectory=` (your project root)
- `EnvironmentFile=` (path to `.env`)
- `ExecStart=` (path to `python3`)

## 2) Required `.env` keys

Minimum required:

- `DATABASE_URL=postgresql+asyncpg://...`

One of these (recommended to set both):

- `ACQUIRING_BASE_URL=https://<bank-host>`
- `PAYMENT_BASE_URL=https://<bank-host>`

If the bank endpoint requires HTTP Basic Auth:

- `ACQUIRING_RPC_BASIC_USERNAME=...`
- `ACQUIRING_RPC_BASIC_PASSWORD=...`

## 3) Enable and run

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now stepup-reconcile.service
sudo systemctl status stepup-reconcile.service
```

## 4) Watch logs

```bash
sudo journalctl -u stepup-reconcile.service -f
```

You should see:

- `Daemon config: rpc=https://.../rpc auth=basic|none interval=...`
- `Found N pending transaction(s) to check`
- `Remote reports tx ... performed -> reconciling`
- `Order ... marked as PAID`

## 5) Troubleshooting checklist

1. If `rpc=<missing>` — your env isn’t loaded or base url keys are missing.
2. If you see HTTP errors (401/403) — Basic Auth is wrong/missing.
3. If it never prints `Found ... pending transaction(s)` — your local DB has no `transactions.state in (0,1)`.
4. If it reconciles tx but still no `PAID` — check `transactions.account_data`:
   - it must contain `order` / `order_id` OR `cart_#`.
   - cart_# is supported by code (it will create/find an order from cart).

## Optional: debug bank response (recommended for 5 minutes)

If you need to see what the bank actually returns for `CheckTransaction`, add `--debug-acquirer` to `ExecStart=` in the unit.

Example:

```bash
ExecStart=/usr/bin/python3 scripts/auto_reconcile_daemon.py --interval 30 --debug-acquirer
```

Then restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart stepup-reconcile.service
sudo journalctl -u stepup-reconcile.service -f
```

You will see lines like:

- `Acquirer raw response for <tx_id>: {...}`

Turn it off after troubleshooting to avoid noisy logs.
