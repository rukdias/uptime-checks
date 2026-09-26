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

## Browser smoke tests

Once a day (11:17 UTC) the Smoke workflow loads every app in headless Chromium,
at desktop (1280x800) and phone (375x812) sizes, and walks the main public
flows: landing pages, the MMT demo league and its standings, the BoozeBoard TV
display, phone menu and demo admin tabs, the Context-Bulbs docs and not-found
states, the Nexus login tabs, the Knight prompter dialog, Rune Reels film
pages and the TVesta board. One spec per app lives in `tests/`.

Every test also fails on a console error, an uncaught exception, a same-origin
response >= 400 (401s from signed-out session probes and 404s a test expects
are allowed), or horizontal overflow at phone width.

The suite is strictly read-only: it never signs in, types into admin forms or
submits anything, and `tests/fixtures.ts` answers every non-GET request (e.g.
analytics beacons) locally with 204 so nothing reaches production.

A failing run uploads the Playwright HTML report as an artifact and opens (or
comments on) an issue labelled `smoke`; the next passing run closes it.

- Run it now: `gh workflow run smoke.yml`.
- Run it locally: `npm ci && npx playwright install chromium && npx playwright test`
  (`npx playwright show-report` opens the report; `--project phone` or a file
  name narrows the run).
