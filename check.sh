#!/usr/bin/env bash
# Checks every target in targets.txt and cert in certs.txt. Prints a markdown
# report to $REPORT (default report.md) and exits 1 if anything is down.
set -uo pipefail
REPORT=${REPORT:-report.md}
CERT_WARN_DAYS=${CERT_WARN_DAYS:-14}
failed=0
{
  echo "| App | Status | Detail |"
  echo "|---|---|---|"
} > "$REPORT"

trim() { local s="$1"; s="${s#"${s%%[![:space:]]*}"}"; echo "${s%"${s##*[![:space:]]}"}"; }

# TIER=30m checks only the 30m targets; TIER=all (default) checks everything.
TIER=${TIER:-all}
while IFS='|' read -r name url tier _; do
  name=$(trim "$name"); url=$(trim "${url:-}"); tier=$(trim "${tier:-30m}")
  [[ -z "$name" || "$name" == \#* ]] && continue
  [[ "$TIER" == "30m" && "$tier" != "30m" ]] && continue
  # Scale-to-zero apps take a few seconds to wake; retry before calling it down.
  code=000; secs=0
  for attempt in 1 2 3; do
    out=$(curl -sS -o /dev/null -w '%{http_code} %{time_total}' --max-time 30 "$url" 2>/dev/null) || out="000 0"
    code=${out%% *}; secs=${out##* }
    [[ "$code" =~ ^2 ]] && break
    sleep 10
  done
  if [[ "$code" =~ ^2 ]]; then
    printf '| %s | up | %s in %.1fs |\n' "$name" "$code" "$secs" >> "$REPORT"
  else
    printf '| %s | **DOWN** | %s from %s after 3 tries |\n' "$name" "$code" "$url" >> "$REPORT"
    failed=1
  fi
done < targets.txt

while read -r host; do
  host=$(trim "${host:-}")
  [[ -z "$host" || "$host" == \#* ]] && continue
  end=$(echo | openssl s_client -servername "$host" -connect "$host:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  if [[ -z "$end" ]]; then
    printf '| %s (TLS) | **DOWN** | could not read the certificate |\n' "$host" >> "$REPORT"; failed=1; continue
  fi
  end_s=$(date -d "$end" +%s 2>/dev/null || date -j -f "%b %e %T %Y %Z" "$end" +%s)
  days=$(( (end_s - $(date +%s)) / 86400 ))
  if (( days < 0 )); then
    printf '| %s (TLS) | **EXPIRED** | certificate expired %d days ago |\n' "$host" "$(( -days ))" >> "$REPORT"; failed=1
  elif (( days < CERT_WARN_DAYS )); then
    printf '| %s (TLS) | **EXPIRING** | certificate expires in %d days |\n' "$host" "$days" >> "$REPORT"; failed=1
  else
    printf '| %s (TLS) | up | certificate valid for %d more days |\n' "$host" "$days" >> "$REPORT"
  fi
done < certs.txt

cat "$REPORT"
exit $failed
