# uptime-checks

A GitHub Action checks the apps in `targets.txt` and the TLS certificates in
`certs.txt`: every 30 minutes for the targets marked `30m` (liveness routes that
can't wake a sleeping database or machine), and every 6 hours for everything,
including database round trips and scale-to-zero apps. When something is down or a certificate is within
14 days of expiring, the run fails (GitHub emails you) and an issue labelled
`down` opens; the next healthy run comments and closes it.

- Add or remove an app: edit `targets.txt` (name | URL that must return 2xx).
- Run it now: Actions → Uptime → Run workflow, or `gh workflow run uptime.yml`.
- Run it locally: `./check.sh`.

Cost: nothing. The repo is public, so Actions minutes are free (as a private
repo it used about 1,560 of the 2,000 free minutes a month). GitHub disables
schedules in public repos after 60 days without a commit, so the 6-hourly run
re-enables both workflows to reset that clock. The tiers exist because Neon bills database compute by
the hour and stays awake 5 minutes after any query: checking every database
every 30 minutes would keep them awake about a sixth of the time.

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
