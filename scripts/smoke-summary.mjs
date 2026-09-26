// Turns Playwright's results.json into a short markdown summary (smoke-report.md)
// for the GitHub issue. Usage: node scripts/smoke-summary.mjs [results.json]
import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2] ?? "results.json";
let data;
try {
  data = JSON.parse(readFileSync(file, "utf8"));
} catch {
  writeFileSync("smoke-report.md", "The smoke suite did not produce results (it may have failed to start).\n");
  process.exit(0);
}

const strip = (s) => (s ?? "").replace(/\u001b\[[0-9;]*m/g, "");
const rows = [];
const walk = (suite, file) => {
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests) {
      if (t.status !== "unexpected") continue;
      const last = t.results.at(-1) ?? {};
      const errors = (last.errors ?? []).map((e) => strip(e.message).split("\n")[0]).filter(Boolean);
      rows.push(`- **${file ?? suite.title}** · ${spec.title} [${t.projectName}]\n` +
        errors.slice(0, 4).map((e) => `  - ${e.slice(0, 300)}`).join("\n"));
    }
  }
  for (const s of suite.suites ?? []) walk(s, file ?? s.file ?? suite.file);
};
for (const s of data.suites ?? []) walk(s, s.file);

const { expected = 0, unexpected = 0, flaky = 0 } = data.stats ?? {};
const head = `Smoke tests: ${expected} passed, ${unexpected} failed, ${flaky} flaky.`;
writeFileSync("smoke-report.md", [head, "", ...rows].join("\n") + "\n");
console.log(head);
