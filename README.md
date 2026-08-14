# Branchline

Branchline is a visual AI workflow editor for binary decision trees. Build a graph in React Flow, connect explicit `YES` and `NO` branches, and run the graph as a durable Inngest function. Every decision node becomes a checkpointed Inngest step and sends its prompt plus the workflow input to OpenAI.

Live demo: https://decision-flow-neon.vercel.app

## What is included

- React Flow canvas with draggable decision nodes and typed branch handles
- Prompt and label editing in the node inspector
- Inngest-backed dynamic graph traversal with retry support
- Strict `YES` / `NO` OpenAI response validation
- Live node, edge, and execution-log states
- Device-local autosave and run history
- Manual save, JSON export, and validated JSON import
- Deterministic demo classifier when no OpenAI key is configured
- Responsive desktop and mobile layouts
- Shadcn-compatible component configuration and UI primitives

## Local setup

Prerequisites: Node.js 22.13 or newer.

```bash
npm install
copy .env.example .env.local
npm run dev
```

In a second terminal, start the Inngest development server:

```bash
npm run inngest:dev
```

Open [http://localhost:3000](http://localhost:3000). The Inngest dashboard is available at [http://localhost:8288](http://localhost:8288).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | No | Enables live OpenAI decisions. If omitted, runs use the labeled deterministic demo classifier. |
| `OPENAI_MODEL` | No | OpenAI model used for decisions. Defaults to `gpt-5.5`. |
| `INNGEST_DEV` | Local only | Routes SDK events to the local Inngest dev server. Set to `1` for local development. |
| `INNGEST_EVENT_KEY` | Production | Sends production events to Inngest Cloud. If omitted, the Vercel demo runs locally in deterministic demo mode. |
| `INNGEST_SIGNING_KEY` | Production | Allows Inngest Cloud to securely sync and call the production function endpoint. |

Do not expose `OPENAI_API_KEY` in browser-side environment variables. It is read only inside the Inngest function.

## How execution works

1. The frontend serializes the visible graph and sends a `workflow/execute` event.
2. Inngest starts at the graph's entry node (the first node with no incoming edge).
3. Each visited node executes inside its own named `step.run()` checkpoint.
4. The OpenAI Responses API evaluates the shared input against the node prompt.
5. Only an exact `YES` or `NO` response is accepted.
6. The matching typed edge selects the next node. A missing matching edge ends that branch.
7. The frontend polls the local run record to animate the active path and update logs.

Cycles are rejected during execution, invalid model output is retried by Inngest, and the function has an `onFailure` handler that records the final error for the UI.

## Project structure

```text
app/
  api/inngest/route.ts           Inngest serve handler
  api/workflow/run/route.ts      Event trigger endpoint
  api/workflow/status/route.ts   Live execution status
  page.tsx                       Product entry page
components/
  decision-node.tsx              Custom React Flow node
  workflow-studio.tsx            Editor and execution UI
  ui/button.tsx                  Shadcn-style button primitive
lib/
  inngest/client.ts              Inngest client
  inngest/functions.ts           Durable workflow executor
  execution-store.ts             Local development run state
  workflow-types.ts              Shared graph and run types
```

## Commands

- `npm run dev` - start Branchline on port 3000
- `npm run inngest:dev` - start Inngest and register the local function
- `npm run build` - create the production build
- `npm test` - build and run server-rendering and integration-shape checks
- `npm run lint` - run ESLint

## Production note

The included run-status store is intentionally process-local for the development deliverable. For horizontally scaled production hosting, replace `lib/execution-store.ts` with a shared store or Inngest Realtime subscription. Graphs themselves are explicitly device-local in this version, matching the project requirements.
