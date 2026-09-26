# uptime-checks

Every 30 minutes a GitHub Action checks the apps in `targets.txt` and the TLS
certificates in `certs.txt`. When something is down or a certificate is within
14 days of expiring, the run fails (GitHub emails you) and an issue labelled
`down` opens; the next healthy run comments and closes it.

- Add or remove an app: edit `targets.txt` (name | URL that must return 2xx).
- Run it now: Actions → Uptime → Run workflow, or `gh workflow run uptime.yml`.
- Run it locally: `./check.sh`.

Cost: one ~1-minute job per run, about 1,440 Actions minutes a month on a
private repo. Making the repo public makes them free and allows a tighter
schedule; nothing here is secret.
