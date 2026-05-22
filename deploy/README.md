# Deploy artifacts

## `stepup-backend.service`

Canonical copy of the systemd unit installed at `/etc/systemd/system/stepup-backend.service` on the production VPS.

Kept here so changes are reviewable. To install or update on the VPS:

```bash
sudo cp deploy/stepup-backend.service /etc/systemd/system/stepup-backend.service
sudo systemctl daemon-reload
sudo systemctl reset-failed stepup-backend
sudo systemctl restart stepup-backend
sudo systemctl status stepup-backend --no-pager -l
```

### Why the `[u]vicorn` trick

The `ExecStartPre` runs `pkill -f "uvicorn app.main"` to clean up any straggler workers. Without the character class, `pkill -f` would match the wrapping `/bin/sh -c "pkill -f \"uvicorn app.main\" ..."` process — i.e. its own parent — kill it, and systemd would see the pre-start die from SIGTERM. Result: startup marked failed, restart loop forever. The `[u]` makes the literal string `[u]vicorn app.main` not match itself, while `[u]vicorn` still matches the real `uvicorn` process.
