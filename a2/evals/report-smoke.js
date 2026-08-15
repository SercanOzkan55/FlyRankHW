const baseUrl = process.env.REPORT_BASE_URL || "http://localhost:3000";
const key = `report-smoke-${Date.now()}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const receiptResponse = await fetch(`${baseUrl}/reports/task-summary`, { method: "POST", headers: { "Idempotency-Key": key } });
  if (receiptResponse.status !== 202) throw new Error(`Expected 202, got ${receiptResponse.status}: ${await receiptResponse.text()}`);
  const receipt = await receiptResponse.json();
  const duplicate = await fetch(`${baseUrl}/reports/task-summary`, { method: "POST", headers: { "Idempotency-Key": key } }).then((response) => response.json());
  if (!duplicate.reused || duplicate.jobId !== receipt.jobId) throw new Error("Idempotency check failed");
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const status = await fetch(`${baseUrl}${receipt.statusUrl}`).then((response) => response.json());
    if (status.status === "completed") { const pdf = await fetch(`${baseUrl}${status.downloadUrl}`); if (pdf.status !== 200 || pdf.headers.get("content-type") !== "application/pdf") throw new Error("PDF download check failed"); console.log(JSON.stringify({ passed: true, jobId: receipt.jobId })); return; }
    if (status.status === "failed") throw new Error(status.error); await sleep(250);
  } throw new Error("Timed out waiting for report worker");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
