async function main() {
  const endpoint = process.env.EVAL_ENDPOINT || "http://localhost:3000/ai/triage";
  const key = `smoke-${Date.now()}`;
  const options = {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": key },
    body: JSON.stringify({ text: "Our card was charged twice for one invoice." }),
  };

  const startedAt = Date.now();
  const firstResponse = await fetch(endpoint, options);
  const elapsedMs = Date.now() - startedAt;
  const first = await firstResponse.json();
  if (firstResponse.status !== 202) throw new Error(`Expected 202, got ${firstResponse.status}`);

  const duplicateResponse = await fetch(endpoint, options);
  const duplicate = await duplicateResponse.json();
  if (duplicate.jobId !== first.jobId || duplicate.reused !== true) {
    throw new Error("Idempotency check failed: duplicate request created different work.");
  }

  const deadline = Date.now() + 30_000;
  let job;
  do {
    const statusResponse = await fetch(`${endpoint}/jobs/${first.jobId}`);
    job = await statusResponse.json();
    if (job.status === "completed" || job.status === "failed") break;
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  } while (Date.now() < deadline);

  if (job?.status !== "completed") throw new Error(`Expected completed, got ${job?.status || "timeout"}`);
  console.log(JSON.stringify({
    acceptedStatus: firstResponse.status,
    acceptanceMs: elapsedMs,
    sameJobForDuplicate: true,
    finalStatus: job.status,
    attempts: job.attempts,
    category: job.result.category,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
