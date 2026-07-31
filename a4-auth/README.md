# A4 Auth — Login & Protect

An Express + TypeScript API that uses **Supabase Auth** as its identity
provider. Users sign up and log in through Supabase, get a JWT access token
back, and present that token as `Authorization: Bearer <token>` to reach the
protected routes. The server never stores or hashes passwords itself — it
forwards credentials to Supabase and verifies the tokens Supabase issues.

## How the flow works

```
Client ──(email + password)──► POST /auth/login ──► Supabase Auth
Client ◄──────(access_token JWT)──────────────────────┘

Client ──(Authorization: Bearer <jwt>)──► GET /protected/profile
                                            │
                                 requireAuth middleware
                                            │
                                  supabase.auth.getUser(jwt)
                                            │
                            valid ──► 200 profile    invalid ──► 401
```

## Setup

1. Create a project at [supabase.com](https://supabase.com) and open
   **Project Settings → API** to find the Project URL and the `anon` public key.
2. Copy the env template and fill it in:

   ```bash
   cp .env.example .env
   ```

   ```
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_KEY=your_anon_public_key
   PORT=3000
   ```

   `.env` is git-ignored — the keys never leave your machine. The server
   refuses to start if either variable is missing.

3. Install dependencies:

   ```bash
   npm install
   ```

> **Email confirmation:** by default Supabase asks new users to confirm their
> email before they can log in. For local testing, turn
> **Authentication → Sign In / Providers → Confirm email** off, or click the
> link in the confirmation mail before calling `/auth/login`.

## Running it

```bash
npm run dev
```

Or build and run the compiled output:

```bash
npm run build && npm start
```

The server logs `Server running and connected to Supabase (port 3000, ...)`
and serves Swagger UI at <http://localhost:3000/docs>.

## API reference

| Method | Endpoint               | Auth required | Success | Errors |
| ------ | ---------------------- | ------------- | ------- | ------ |
| GET    | `/health`              | No            | `200`   | —      |
| GET    | `/public/info`         | No            | `200`   | —      |
| POST   | `/auth/signup`         | No            | `201`   | `400` missing/rejected credentials |
| POST   | `/auth/login`          | No            | `200`   | `400` missing fields, `401` invalid credentials |
| POST   | `/auth/logout`         | **Yes**       | `204`   | `401` missing/invalid token |
| GET    | `/protected/profile`   | **Yes**       | `200`   | `401` missing/invalid token |
| GET    | `/protected/dashboard` | **Yes**       | `200`   | `401` missing/invalid token |

`401` bodies are `{"error": "Access token required"}` when the header is
missing or malformed, and `{"error": "Invalid or expired token"}` when
Supabase rejects the token.

### Try it with curl

```bash
curl -i -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

```bash
curl -i http://localhost:3000/protected/profile \
  -H "Authorization: Bearer <PASTE_ACCESS_TOKEN>"
```

```bash
curl -i -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <PASTE_ACCESS_TOKEN>"
```

## Swagger UI

Open <http://localhost:3000/docs>, click **Authorize**, paste the
`access_token` from `/auth/login`, and use **Try it out** on any padlocked
route. The raw spec is served at `/openapi.json`.

![Swagger UI showing public, auth, and protected routes with padlocks](docs/swagger-ui.png)

## Project layout

```
openapi.json              Hand-written OpenAPI 3 spec (bearerAuth security scheme)
src/
  index.ts                App wiring: json parsing, routers, error handler, listen
  config.ts               Reads and validates SUPABASE_URL / SUPABASE_KEY / PORT
  supabase.ts             Stateless server-side Supabase client
  bearerToken.ts          Parses "Authorization: Bearer <token>" safely
  asyncRoute.ts           Forwards async handler rejections to the error middleware
  types.ts                AuthedRequest + the public shape of a profile
  docs.ts                 Serves Swagger UI at /docs from openapi.json
  middleware/
    requireAuth.ts        The one guard: extract token -> verify -> attach user
  routes/
    publicRoutes.ts       GET /public/info
    authRoutes.ts         POST /auth/signup, /auth/login, /auth/logout
    protectedRoutes.ts    GET /protected/profile, /protected/dashboard
```

## Security notes

- Only the **anon** public key is used. The `service_role` key is never needed
  here and must never be shipped in a client-facing service.
- Passwords are only ever forwarded to Supabase; nothing is logged or stored.
- Token verification is delegated to `supabase.auth.getUser(token)`, so
  expired, tampered, or revoked tokens all fail — the server does not decode
  JWTs itself and does not trust their payload.
- Login failures always return the same generic `Invalid login credentials`
  message, so the endpoint does not reveal which emails are registered.
