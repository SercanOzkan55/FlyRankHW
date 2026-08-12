const { readFile } = require("node:fs/promises");
const { resolve } = require("node:path");

async function main() {
  const endpoint = process.env.EVAL_ENDPOINT || "http://localhost:3000/ai/triage";
  const cases = JSON.parse(
    await readFile(resolve(__dirname, "cases.json"), "utf8")
  );
  const failures = [];
  let passed = 0;

  for (const testCase of cases) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: testCase.text }),
    });
    const body = await response.json();
    const ok = response.ok && body.category === testCase.expectedCategory;
    if (ok) passed += 1;
    else {
      failures.push({
        id: testCase.id,
        expected: testCase.expectedCategory,
        actual: body.category || `${response.status} ${body.error || "unknown error"}`,
      });
    }
    console.log(`${ok ? "PASS" : "FAIL"} ${testCase.id}: ${body.category || body.error}`);
  }

  const percent = ((passed / cases.length) * 100).toFixed(1);
  console.log(`\nCategory accuracy: ${passed}/${cases.length} (${percent}%)`);
  if (failures.length) console.log("Failures:", JSON.stringify(failures, null, 2));
  process.exitCode = failures.length ? 1 : 0;
}

main().catch((error) => {
  console.error("Eval could not run:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

