# Background job design

## Goal

Move the slow AI classification outside the HTTP request. The API accepts and
validates work, the worker owns model execution, and a status resource exposes
only trusted state and schema-validated output.

## Contract

- `POST /ai/triage` returns `202 Accepted`, a UUID `jobId`, and a `statusUrl`.
- `GET /ai/triage/jobs/:jobId` returns `queued`, `processing`, `completed`, or
  `failed`. Only `completed` includes the model result.
- `Idempotency-Key` maps repeated submissions to the same job. If it is absent,
  the API generates a unique key, so deliberate retries should always supply it.
- The API never calls the model. `src/jobs/worker.ts` is a separate process.

## Delivery semantics and idempotency

This is an **at-least-once** queue: a worker can crash after a model call but
before saving its result, so a stale `processing` job may run again. That is
safe because classification has no external side effect, state is stored by
stable job ID, `completeJob` is idempotent, and a completed job is terminal.
Repeated HTTP submissions with one idempotency key also resolve to one job ID.

The local adapter stores one JSON file per job and uses atomic lock creation for
claims and updates. It is intentionally appropriate for a one-machine demo. A
multi-host deployment should use a transactional Postgres/Supabase queue or
Redis without changing the public API contract.

## Failure handling

- Transient failures (timeouts, `429`, provider `5xx`, or repeatedly invalid
  model output) get at most three worker attempts by default. Configuration and
  provider authentication errors fail immediately because retrying cannot fix them.
- Worker retries use 1s, 2s, then capped exponential backoff.
- Provider calls retain their bounded timeout/retry policy from A6.
- After the last attempt, status becomes `failed`; internal details are kept in
  the job/worker logs while the public endpoint returns a generic error.
- A permanent-failure alert is emitted to stderr and appended to
  `logs/job-alerts.jsonl` for a real monitoring collector to ingest.
- A `processing` job older than `JOB_STALE_MS` is eligible for recovery.

## Measured verification (2026-08-13)

- Acceptance response: HTTP `202` in **157 ms** while no worker was running.
- Initial status: `queued`.
- Duplicate request: `reused: true`, same job ID.
- Worker result: `completed`, one attempt.
- Forced temporary provider `500` test: three attempts, final `failed`, a
  generic public error, and matching `ai_job_failed_permanently` alert.

Exact timing depends on the machine; correctness is verified by
`npm run jobs:smoke`, and the eight labelled AI cases by `npm run eval`.
