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
    const accepted = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": `eval-${testCase.id}-${Date.now()}`,
      },
      body: JSON.stringify({ text: testCase.text }),
    });
    const receipt = await accepted.json();
    if (accepted.status !== 202 || !receipt.jobId) {
      throw new Error(`Expected 202 for ${testCase.id}, received ${accepted.status}`);
    }
    const body = await waitForResult(`${endpoint}/jobs/${receipt.jobId}`);
    const ok = body.status === "completed" && body.result?.category === testCase.expectedCategory;
    if (ok) passed += 1;
    else {
      failures.push({
        id: testCase.id,
        expected: testCase.expectedCategory,
        actual: body.result?.category || `${body.status} ${body.error || "unknown error"}`,
      });
    }
    console.log(`${ok ? "PASS" : "FAIL"} ${testCase.id}: ${body.result?.category || body.error}`);
  }

  const percent = ((passed / cases.length) * 100).toFixed(1);
  console.log(`\nCategory accuracy: ${passed}/${cases.length} (${percent}%)`);
  if (failures.length) console.log("Failures:", JSON.stringify(failures, null, 2));
  process.exitCode = failures.length ? 1 : 0;
}

async function waitForResult(statusUrl) {
  const deadline = Date.now() + Number(process.env.EVAL_TIMEOUT_MS || 180000);
  while (Date.now() < deadline) {
    const response = await fetch(statusUrl);
    const body = await response.json();
    if (body.status === "completed" || body.status === "failed") return body;
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`Timed out waiting for ${statusUrl}`);
}

main().catch((error) => {
  console.error("Eval could not run:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
