import { getRun } from "@/lib/execution-store";

export async function GET(request: Request) {
  const runId = new URL(request.url).searchParams.get("runId");
  if (!runId) {
    return Response.json({ error: "runId is required" }, { status: 400 });
  }

  const run = getRun(runId);
  if (!run) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }

  return Response.json(run, {
    headers: { "Cache-Control": "no-store" },
  });
}
