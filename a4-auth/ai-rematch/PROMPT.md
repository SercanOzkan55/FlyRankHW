# The prompt

Written from memory before looking back at my own implementation, then handed
to Claude (Opus) in a fresh context with no access to the `a4-auth/` code.

---

> Build me a Node.js + Express API that uses Supabase Auth for authentication.
>
> Endpoints:
>
> - `POST /auth/signup` — takes `{ email, password }`, registers the user with
>   `supabase.auth.signUp()`, returns 201 with the user. Return 400 if email or
>   password is missing.
> - `POST /auth/login` — uses `supabase.auth.signInWithPassword()`, returns 200
>   with the access token and refresh token. 400 if fields are missing, 401
>   with `{ "error": "Invalid login credentials" }` if the credentials are wrong.
> - `POST /auth/logout` — protected, signs the user out, returns 204.
> - `GET /public/info` — no auth, returns 200 with a public message.
> - `GET /protected/profile` — protected, returns 200 with the user's id, email
>   and created_at.
>
> Protected routes read the token from the `Authorization: Bearer <token>`
> header and verify it with `supabase.auth.getUser(token)`. Return 401 with
> `{ "error": "Access token required" }` if the header is missing and 401 with
> `{ "error": "Invalid or expired token" }` if the token is invalid or expired.
> Put the token check in reusable middleware instead of repeating it in every
> route.
>
> Read `SUPABASE_URL`, `SUPABASE_KEY` and `PORT` from a `.env` file. Also serve
> Swagger UI at `/docs` from an `openapi.json` with a bearer security scheme so
> the protected routes show a padlock.

---

The generated result is in [`server.js`](server.js) and
[`openapi.json`](openapi.json), unedited apart from changing the port to 3001
so both servers can run side by side. The analysis is in the
[AI vs Me](../README.md#ai-vs-me-stage-7-bonus) section of the main README.
