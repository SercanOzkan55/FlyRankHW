# A2 Task Service

A small Express + TypeScript task API. It started with an in-memory store and
was swapped to a real Postgres repository without touching the service or
route layer, proving the interface-based layering works.

## Architecture

```
src/
  types.ts                          Task, CreateTaskInput, TaskRepository interface
  taskService.ts                    TaskService — business logic, depends only on TaskRepository
  routes.ts                        Express routes — depend only on TaskService
  repositories/
    memoryTaskRepository.ts         In-memory implementation of TaskRepository
    postgresTaskRepository.ts       Postgres implementation of TaskRepository
  db.ts                             pg Pool built from DATABASE_URL
  index.ts                          Picks Memory or Postgres repo based on env, wires everything up
```

`index.ts` chooses the repository at startup:

```ts
function buildRepository(): TaskRepository {
  if (process.env.DATABASE_URL) {
    return new PostgresTaskRepository(createPool());
  }
  return new MemoryTaskRepository();
}
```

**Honest note:** `TaskService` and `routes.ts` were written once, against the
`TaskRepository` interface, and were never edited when the Postgres
repository was added. Only `repositories/postgresTaskRepository.ts`,
`db.ts`, and the repository-selection line in `index.ts` are new. That is
the whole point of the exercise.

## Running the stack

```bash
cp .env.example .env      # already gitignored; edit values if you want
docker compose up -d --build
```

This starts:
- `db` — `postgres:16-alpine` with a named volume (`db_data`) mounted at
  `/var/lib/postgresql/data`, and `sql/init.sql` mounted so it runs once on
  first boot to create the `tasks` table.
- `app` — the Express API, built from the local `Dockerfile`, waiting on the
  db's healthcheck before starting.

The API is on `http://localhost:3000`.

### Endpoints

| Method | Path         | Body                          |
|--------|--------------|--------------------------------|
| GET    | /health      | –                              |
| GET    | /tasks       | –                              |
| GET    | /tasks/:id   | –                              |
| POST   | /tasks       | `{ "title": "..." }`           |
| PATCH  | /tasks/:id   | `{ "title"?, "done"? }`        |
| DELETE | /tasks/:id   | –                              |

## Environment

`.env` is gitignored; `.env.example` is committed as the template.

```
PORT=3000
DATABASE_URL=postgresql://a2_user:a2_password@db:5432/a2_db
POSTGRES_USER=a2_user
POSTGRES_PASSWORD=a2_password
POSTGRES_DB=a2_db
```

`DATABASE_URL` uses `db` as the host because that's the service name on the
Docker Compose network. If `DATABASE_URL` is unset, `index.ts` falls back to
the in-memory repository (used for local `npm run dev` without Docker).

## Proving persistence

This was actually run, not just described:

1. `docker compose up -d --build` — stack came up healthy.
2. Created two tasks via `POST /tasks` (`Buy milk`, `Write README`) and
   confirmed both via `GET /tasks`.
3. `docker compose down` — this stops **and removes** both containers
   (app and db), keeping only the named volume `db_data`.
4. `docker compose up -d` — fresh containers created from scratch.
5. `GET /tasks` again — both tasks were still there, with their original
   `id` and `createdAt` values, unchanged.

That confirms the data lives in the volume, not in the container's
writable layer — a full container recreation doesn't lose it.

## Notes / gotchas hit while building this

- Docker Desktop on this machine failed to start with an AF_UNIX socket
  error from its "Docker AI / Inference" feature
  (`EnableDockerAI` in `settings-store.json`). Disabling that flag and
  enabling Windows Developer Mode fixed it. Unrelated to the app itself,
  but recorded here in case it resurfaces after a Docker Desktop update.

## Stretch goals (not done)

- Redis in the compose file, pinged from the app.
- An index + `EXPLAIN ANALYZE` before/after comparison on a seeded table.
