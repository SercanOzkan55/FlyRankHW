import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Branchline workflow editor", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Branchline - Visual AI Workflows<\/title>/i);
  assert.match(html, /BRANCHLINE/);
  assert.match(html, /Turn judgment into a path/);
  assert.match(html, /Run flow/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("ships the Inngest endpoint, graph editor, and social card", async () => {
  const [page, functions, route, packageJson] = await Promise.all([
    readFile(new URL("../components/workflow-studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/inngest/functions.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/inngest/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<ReactFlow/);
  assert.match(page, /localStorage/);
  assert.match(page, /importGraph/);
  assert.match(functions, /step\.run\(`decision-/);
  assert.match(functions, /response\.output_text/);
  assert.match(route, /serve\(\{ client: inngest, functions \}\)/);
  assert.match(packageJson, /"@xyflow\/react"/);
  assert.match(packageJson, /"inngest"/);
  assert.match(packageJson, /"openai"/);
  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
